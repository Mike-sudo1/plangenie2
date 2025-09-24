import type {
  Activity,
  DayPlan,
  TripPlan,
  Interest,
  PriceLevel,
  CityStay,
  TravelLeg,
  PlaceLite,
} from "../types";
import { geocodePlace, nearbyPlaces, getTravelTimeMinutes } from "../services/maps";
import { proposeCitiesForCountry } from "../services/openai";

// ---- Helpers
function addMinutes(iso: string, mins: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

function estimateMealCostFromPriceLevel(meal: "breakfast" | "lunch" | "dinner", pl?: PriceLevel) {
  const base = { breakfast: 8, lunch: 14, dinner: 22 }[meal];
  const mult = pl === 0 ? 0 : pl === 1 ? 0.8 : pl === 2 ? 1.0 : pl === 3 ? 1.6 : 2.4;
  return Math.round(base * mult);
}

function estimateActivityCostFromPriceLevel(category: Interest, pl?: PriceLevel) {
  const defaultByCategory: Record<Interest, number> = {
    museums: 15,
    culture: 10,
    parks: 0,
    art: 8,
    landmarks: 0,
    shopping: 0,
    nightlife: 12,
    food: 0,
  };
  if (pl === 0) return 0;
  if (pl === 1) return Math.max(5, defaultByCategory[category] * 0.7);
  if (pl === 2) return Math.max(8, defaultByCategory[category] * 1.0);
  if (pl === 3) return Math.max(15, defaultByCategory[category] * 1.6);
  if (pl === 4) return Math.max(25, defaultByCategory[category] * 2.2);
  return defaultByCategory[category];
}

type MealType = "breakfast" | "lunch" | "dinner";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner"];

const MIN_MEAL_COST: Record<MealType, number> = {
  breakfast: 6,
  lunch: 11,
  dinner: 18,
};

const MIN_ACTIVITY_SLOT_COST = 8;

type MealSelection = { place: PlaceLite; cost: number };

type ActivityCandidate = PlaceLite & { _category?: Interest };

type ActivitySelection = { place: ActivityCandidate; cost: number; category: Interest };

function sortPlacesByQuality<T extends { rating?: number; userRatingsTotal?: number; priceLevel?: PriceLevel; name?: string }>(
  places: T[],
): T[] {
  return [...places].sort((a, b) => {
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
    if (Math.abs(ratingDiff) > 0.15) return ratingDiff;
    const reviewsDiff = (b.userRatingsTotal ?? 0) - (a.userRatingsTotal ?? 0);
    if (reviewsDiff !== 0) return reviewsDiff;
    const priceDiff = (a.priceLevel ?? 2) - (b.priceLevel ?? 2);
    if (priceDiff !== 0) return priceDiff;
    const nameA = (a as any).name ?? "";
    const nameB = (b as any).name ?? "";
    return nameA.localeCompare(nameB);
  });
}

function chooseMealCandidate(options: {
  mealType: MealType;
  sortedCandidates: PlaceLite[];
  usedIds: Set<string>;
  allowReuse: boolean;
  remainingBudget: number;
  remainingMeals: MealType[];
}): MealSelection | undefined {
  const { mealType, sortedCandidates, usedIds, allowReuse, remainingBudget, remainingMeals } = options;
  const safeRemaining = Math.max(0, remainingBudget);
  const minRemaining = remainingMeals.reduce((sum, type) => sum + MIN_MEAL_COST[type], 0);
  const baseAllowance = Math.max(
    MIN_MEAL_COST[mealType],
    Math.min(safeRemaining - minRemaining, safeRemaining),
  );
  const target = Number.isFinite(baseAllowance) ? baseAllowance : MIN_MEAL_COST[mealType];
  const tolerance = Math.max(4, target * 0.35);
  const limit = Math.min(safeRemaining, target + tolerance);

  let fallback: MealSelection | undefined;

  for (const candidate of sortedCandidates) {
    if (!candidate) continue;
    if (!allowReuse && usedIds.has(candidate.id)) continue;
    const cost = estimateMealCostFromPriceLevel(mealType, candidate.priceLevel);
    if (!fallback) {
      fallback = { place: candidate, cost };
    } else if (cost < fallback.cost - 2) {
      fallback = { place: candidate, cost };
    } else if (Math.abs(cost - fallback.cost) <= 2) {
      const fallbackRating = fallback.place.rating ?? 0;
      const candidateRating = candidate.rating ?? 0;
      if (candidateRating > fallbackRating) {
        fallback = { place: candidate, cost };
      }
    }
    if (cost <= limit + 2) {
      return { place: candidate, cost };
    }
  }

  return fallback;
}

function chooseActivityCandidate(options: {
  sortedCandidates: ActivityCandidate[];
  usedIds: Set<string>;
  blockedIds: Set<string>;
  allowReuse: boolean;
  budgetRemaining: number;
  slotsRemaining: number;
}): ActivitySelection | undefined {
  const { sortedCandidates, usedIds, blockedIds, allowReuse, budgetRemaining, slotsRemaining } = options;

  const skipUsed = (candidate: ActivityCandidate) => !allowReuse && usedIds.has(candidate.id);

  let base = sortedCandidates.filter((candidate) => !skipUsed(candidate));
  if (!base.length) {
    base = [...sortedCandidates];
  }
  let withoutBlocked = base.filter((candidate) => !blockedIds.has(candidate.id));
  if (!withoutBlocked.length) {
    withoutBlocked = base;
  }
  let available = withoutBlocked;
  if (!available.length) {
    available = [...sortedCandidates];
  }
  if (!available.length) return undefined;

  const scored = available.map<ActivitySelection>((candidate) => {
    const category = (candidate._category ?? "landmarks") as Interest;
    const cost = estimateActivityCostFromPriceLevel(category, candidate.priceLevel);
    return { place: candidate, category, cost };
  });

  const nonFood = scored.filter((item) => item.category !== "food");
  const pool = nonFood.length ? nonFood : scored;

  const safeRemaining = Math.max(0, budgetRemaining);
  const reserve = Math.max(0, slotsRemaining * MIN_ACTIVITY_SLOT_COST);
  const baseAllowance = Math.max(0, Math.min(safeRemaining - reserve, safeRemaining));
  const tolerance = Math.max(5, baseAllowance * 0.5);
  const limit = baseAllowance + tolerance;

  const affordable = pool.filter((item) => item.cost <= limit + 2 || safeRemaining === 0);
  const consider = (affordable.length ? affordable : pool).slice();

  consider.sort((a, b) => {
    if (affordable.length) {
      const ratingDiff = (b.place.rating ?? 0) - (a.place.rating ?? 0);
      if (Math.abs(ratingDiff) > 0.15) return ratingDiff;
      const reviewsDiff = (b.place.userRatingsTotal ?? 0) - (a.place.userRatingsTotal ?? 0);
      if (reviewsDiff !== 0) return reviewsDiff;
      const costDiff = a.cost - b.cost;
      if (costDiff !== 0) return costDiff;
      return (a.place.name ?? "").localeCompare(b.place.name ?? "");
    }
    const costDiff = a.cost - b.cost;
    if (costDiff !== 0) return costDiff;
    const ratingDiff = (b.place.rating ?? 0) - (a.place.rating ?? 0);
    if (Math.abs(ratingDiff) > 0.15) return ratingDiff;
    return (b.place.userRatingsTotal ?? 0) - (a.place.userRatingsTotal ?? 0);
  });

  return consider[0];
}

function planStartAfter(activity: Activity | undefined, fallbackStartISO: string, fallbackDuration: number, offsetMinutes: number) {
  const anchor = activity?.end ?? addMinutes(fallbackStartISO, fallbackDuration);
  return addMinutes(anchor, offsetMinutes);
}

function toActivity(p: any, kind: "meal" | "activity", category: Interest, timeISO: string, durationMin: number, mealTag?: "breakfast" | "lunch" | "dinner"): Activity {
  const priceLevel = p.priceLevel as PriceLevel | undefined;
  const estimatedCost =
    kind === "meal"
      ? estimateMealCostFromPriceLevel((mealTag || "lunch"), priceLevel)
      : estimateActivityCostFromPriceLevel(category, priceLevel);

  return {
    kind,
    id: p.id,
    name: p.name,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    googleMapsUri: p.googleMapsUri,
    rating: p.rating,
    userRatingsTotal: p.userRatingsTotal,
    priceLevel,
    websiteUri: p.websiteUri,
    start: timeISO,
    end: addMinutes(timeISO, durationMin),
    estimatedCost,
  };
}

function orderCitiesEfficiently(cities: CityStay[]) {
  if (cities.length <= 2) return cities;
  const remaining = [...cities];
  const route: CityStay[] = [remaining.shift()!];
  while (remaining.length) {
    const last = route[route.length - 1];
    let bestIdx = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      const d =
        Math.hypot(c.lat - last.lat, c.lng - last.lng);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    route.push(remaining.splice(bestIdx, 1)[0]);
  }
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 2; i++) {
      for (let k = i + 1; k < route.length - 1; k++) {
        const A = route[i - 1];
        const B = route[i];
        const C = route[k];
        const D = route[k + 1];
        const d1 = Math.hypot(A.lat - B.lat, A.lng - B.lng) + Math.hypot(C.lat - D.lat, C.lng - D.lng);
        const d2 = Math.hypot(A.lat - C.lat, A.lng - C.lng) + Math.hypot(B.lat - D.lat, B.lng - D.lng);
        if (d2 < d1) {
          const middle = route.slice(i, k + 1).reverse();
          route.splice(i, middle.length, ...middle);
          improved = true;
        }
      }
    }
  }
  return route;
}

const INTEREST_TO_TYPES: Record<Interest, string[]> = {
  food: ["restaurant", "cafe", "bakery"],
  culture: ["tourist_attraction", "point_of_interest"],
  museums: ["museum"],
  parks: ["park"],
  art: ["art_gallery"],
  landmarks: ["tourist_attraction"],
  shopping: ["shopping_mall"],
  nightlife: ["bar", "night_club"],
};

async function findMealsNear(lat: number, lng: number, priceLevels: PriceLevel[] = [1,2,3], radius=2500) {
  const meals = await nearbyPlaces({
    lat, lng, radiusMeters: radius, includedTypes: ["restaurant"], minRating: 4.1, priceLevels, maxResults: 20
  });
  return meals;
}

async function findActivitiesNear(lat: number, lng: number, interests: Interest[], radius=4000) {
  const results: any[] = [];
  for (const cat of interests) {
    const types = INTEREST_TO_TYPES[cat] ?? ["tourist_attraction"];
    const places = await nearbyPlaces({
      lat, lng, radiusMeters: radius, includedTypes: types, minRating: 4.2, maxResults: 20
    });
    for (const p of places) results.push({ ...p, _category: cat as Interest });
  }
  const seen = new Set<string>();
  return results.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

export async function createDayPlan(params: {
  location: string;
  dateISO: string;
  interests: Interest[];
  budgetPerDay?: number;
}): Promise<DayPlan> {
  const g = await geocodePlace(params.location);
  if (g.kind === "country") {
    throw new Error("Day plan expects a city. You entered a country.");
  }

  const lat = g.lat;
  const lng = g.lng;
  const breakfastTime = new Date(`${params.dateISO}T08:00:00`).toISOString();
  const lunchTime = new Date(`${params.dateISO}T12:30:00`).toISOString();
  const dinnerTime = new Date(`${params.dateISO}T19:30:00`).toISOString();

  const perDayInput = params.budgetPerDay ?? 80;
  const perDay = Number.isFinite(perDayInput) && perDayInput > 0 ? perDayInput : 80;
  const mealBudgetTarget = perDay * 0.5;

  const mealPL: PriceLevel[] = perDay < 50 ? [0, 1, 2] : perDay < 100 ? [1, 2, 3] : [2, 3, 4];

  let mealOptions = await findMealsNear(lat, lng, mealPL);
  if (mealOptions.length < 3) {
    const expanded = await findMealsNear(lat, lng, [0, 1, 2, 3, 4], 6000);
    mealOptions = mealOptions.concat(expanded);
  }
  if (!mealOptions.length) {
    throw new Error("No restaurants found for the selected location.");
  }

  const mealCandidates = sortPlacesByQuality(mealOptions);
  const mealSelections: Record<MealType, MealSelection> = {} as Record<MealType, MealSelection>;
  const uniqueMealIds = new Set(mealOptions.map((m) => m.id));
  const allowMealReuse = uniqueMealIds.size < MEAL_ORDER.length;
  const usedMealIds = new Set<string>();
  let remainingMealBudget = mealBudgetTarget;

  for (let i = 0; i < MEAL_ORDER.length; i++) {
    const mealType = MEAL_ORDER[i];
    const remainingMeals = MEAL_ORDER.slice(i + 1);
    let selection = chooseMealCandidate({
      mealType,
      sortedCandidates: mealCandidates,
      usedIds: usedMealIds,
      allowReuse,
      remainingBudget: remainingMealBudget,
      remainingMeals,
    });

    if (!selection) {
      const fallbackPlace =
        mealCandidates.find((candidate) => allowMealReuse || !usedMealIds.has(candidate.id)) ??
        mealCandidates[0];
      if (fallbackPlace) {
        selection = {
          place: fallbackPlace,
          cost: estimateMealCostFromPriceLevel(mealType, fallbackPlace.priceLevel),
        };
      }
    }

    if (!selection) {
      throw new Error("Unable to find meals for the itinerary.");
    }

    mealSelections[mealType] = selection;
    usedMealIds.add(selection.place.id);
    remainingMealBudget = Math.max(0, remainingMealBudget - selection.cost);
  }

  const breakfast = toActivity(mealSelections.breakfast.place, "meal", "food", breakfastTime, 60, "breakfast");
  const lunch = toActivity(mealSelections.lunch.place, "meal", "food", lunchTime, 60, "lunch");
  const dinner = toActivity(mealSelections.dinner.place, "meal", "food", dinnerTime, 90, "dinner");

  const mealsTotal = breakfast.estimatedCost + lunch.estimatedCost + dinner.estimatedCost;
  let activityBudget = Math.max(0, perDay - mealsTotal);

  const interestList =
    params.interests && params.interests.length
      ? params.interests
      : (["landmarks", "parks"] as Interest[]);

  let activityOptions = await findActivitiesNear(lat, lng, interestList);
  if (activityOptions.length < 2) {
    const extra = await nearbyPlaces({
      lat,
      lng,
      radiusMeters: 5000,
      includedTypes: ["tourist_attraction", "park"],
      minRating: 4.0,
      maxResults: 20,
    });
    activityOptions = activityOptions.concat(
      extra.map((place) => ({ ...place, _category: "landmarks" as Interest })),
    );
  }
  if (!activityOptions.length) {
    activityOptions = [
      {
        id: g.placeId || `${lat},${lng}`,
        name: `Explore ${g.name}`,
        address: g.name,
        lat,
        lng,
        googleMapsUri:
          g.placeId
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.name)}&query_place_id=${encodeURIComponent(
                g.placeId,
              )}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.name)}`,
        rating: undefined,
        userRatingsTotal: undefined,
        priceLevel: 0,
        websiteUri: undefined,
        types: [],
        _category: "landmarks" as Interest,
      },
    ];
  }

  const activityCandidates = sortPlacesByQuality(activityOptions);
  const uniqueActivityIds = new Set(activityOptions.map((a) => a.id));
  const allowActivityReuse = uniqueActivityIds.size < 2;
  const blockedActivityIds = new Set<string>(Array.from(usedMealIds));
  const usedActivityIds = new Set<string>();

  const pickActivity = (slotsRemaining: number, budgetForSlot: number): ActivitySelection => {
    let selection = chooseActivityCandidate({
      sortedCandidates: activityCandidates,
      usedIds: usedActivityIds,
      blockedIds: blockedActivityIds,
      allowReuse: allowActivityReuse,
      budgetRemaining: budgetForSlot,
      slotsRemaining,
    });

    if (!selection) {
      const fallbackCandidate =
        activityCandidates.find(
          (candidate) =>
            !usedActivityIds.has(candidate.id) && !blockedActivityIds.has(candidate.id),
        ) ??
        activityCandidates.find((candidate) => !usedActivityIds.has(candidate.id)) ??
        activityCandidates[0];

      if (fallbackCandidate) {
        const category = (fallbackCandidate._category ?? "landmarks") as Interest;
        const cost = estimateActivityCostFromPriceLevel(category, fallbackCandidate.priceLevel);
        selection = { place: fallbackCandidate, cost, category };
      }
    }

    if (!selection) {
      throw new Error("Unable to find daytime activities.");
    }

    usedActivityIds.add(selection.place.id);
    blockedActivityIds.add(selection.place.id);
    return selection;
  };

  const morningSelection = pickActivity(1, activityBudget);
  const morningStart = planStartAfter(breakfast, breakfastTime, 60, 45);
  const morning = toActivity(
    morningSelection.place,
    "activity",
    morningSelection.category,
    morningStart,
    120,
  );
  activityBudget = Math.max(0, perDay - (mealsTotal + morning.estimatedCost));

  const afternoonSelection = pickActivity(0, activityBudget);
  const afternoonStart = planStartAfter(lunch, lunchTime, 60, 45);
  const afternoon = toActivity(
    afternoonSelection.place,
    "activity",
    afternoonSelection.category,
    afternoonStart,
    150,
  );

  const baseTotal =
    breakfast.estimatedCost +
    lunch.estimatedCost +
    dinner.estimatedCost +
    morning.estimatedCost +
    afternoon.estimatedCost;

  let evening: Activity | undefined;
  let totalEstimatedCost = baseTotal;

  const eveningBudget = Math.max(0, perDay - baseTotal);
  if (eveningBudget >= 12) {
    const nightlifeRaw = await nearbyPlaces({
      lat,
      lng,
      radiusMeters: 3200,
      includedTypes: ["bar", "night_club"],
      minRating: 4.2,
      maxResults: 12,
    });
    const nightlifeCandidates = sortPlacesByQuality(
      nightlifeRaw.map((place) => ({ ...place, _category: "nightlife" as Interest })),
    );
    const eveningSelection = chooseActivityCandidate({
      sortedCandidates: nightlifeCandidates,
      usedIds: usedActivityIds,
      blockedIds: blockedActivityIds,
      allowReuse: true,
      budgetRemaining: eveningBudget,
      slotsRemaining: 0,
    });

    if (eveningSelection) {
      const eveningStart = planStartAfter(dinner, dinnerTime, 90, 30);
      const eveningActivity = toActivity(
        eveningSelection.place,
        "activity",
        eveningSelection.category,
        eveningStart,
        90,
      );
      const projectedTotal = baseTotal + eveningActivity.estimatedCost;
      if (projectedTotal <= perDay + 5) {
        evening = eveningActivity;
        totalEstimatedCost = projectedTotal;
      }
    }
  }

  if (totalEstimatedCost > perDay && evening) {
    totalEstimatedCost = baseTotal;
    evening = undefined;
  }

  totalEstimatedCost = Math.round(Math.min(totalEstimatedCost, perDay));

  return {
    date: params.dateISO,
    city: g.name,
    country: g.country,
    breakfast,
    morning,
    lunch,
    afternoon,
    dinner,
    evening,
    totalEstimatedCost,
  };
}

export async function createTripPlan(params: {
  location: string;
  arrivalISO: string;
  departureISO: string;
  interests: Interest[];
  budgetPerDay?: number;
  travelMode?: "driving" | "transit";
}): Promise<TripPlan> {
  const arrival = new Date(params.arrivalISO);
  const departure = new Date(params.departureISO);
  const totalNights = Math.max(1, Math.round((+departure - +arrival) / (1000*60*60*24)));

  const g = await geocodePlace(params.location);

  if (g.kind !== "country") {
    const days: any[] = [];
    for (let i = 0; i < totalNights; i++) {
      const d = new Date(arrival);
      d.setDate(arrival.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      days.push(await createDayPlan({
        location: g.name, dateISO: iso, interests: params.interests, budgetPerDay: params.budgetPerDay
      }));
    }
    return { order: [{ city: g.name, country: g.country || "", lat: g.lat, lng: g.lng, nights: totalNights }], travel: [], days, totalNights };
  }

  const rawCities = await proposeCitiesForCountry({
    country: g.name,
    totalNights,
    interests: params.interests,
    budgetPerDay: params.budgetPerDay,
  });
  if (!rawCities.length) throw new Error("Could not propose cities for the country.");

  const ordered = orderCitiesEfficiently(rawCities);

  const travel: TravelLeg[] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const A = ordered[i], B = ordered[i + 1];
    const { minutes, distanceKm } = await getTravelTimeMinutes({
      from: { lat: A.lat, lng: A.lng }, to: { lat: B.lat, lng: B.lng },
      mode: params.travelMode ?? "transit",
    });
    travel.push({
      from: A.city, to: B.city, mode: (params.travelMode ?? "transit"), durationMinutes: minutes || 120, distanceKm
    });
  }

  const days: any[] = [];
  let dayCursor = new Date(arrival);
  for (const c of ordered) {
    for (let i = 0; i < c.nights; i++) {
      const iso = new Date(dayCursor).toISOString().slice(0, 10);
      days.push(await createDayPlan({
        location: c.city, dateISO: iso, interests: params.interests, budgetPerDay: params.budgetPerDay
      }));
      dayCursor.setDate(dayCursor.getDate() + 1);
    }
  }

  return { order: ordered, travel, days, totalNights };
}
