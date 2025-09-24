import type {
  Activity,
  DayPlan,
  TripPlan,
  Interest,
  PriceLevel,
  CityStay,
  TravelLeg,
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

function pick<T>(arr: T[], count = 1): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < count) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
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

  const lat = g.lat, lng = g.lng;
  const breakfastTime = new Date(params.dateISO + "T08:00:00").toISOString();
  const lunchTime     = new Date(params.dateISO + "T12:30:00").toISOString();
  const dinnerTime    = new Date(params.dateISO + "T19:30:00").toISOString();

  const perDay = params.budgetPerDay ?? 80;
  const mealBucket = perDay * 0.5;
  const activityBucket = perDay * 0.5;

  const mealPL: PriceLevel[] = perDay < 50 ? [0,1,2] : perDay < 100 ? [1,2,3] : [2,3,4];

  const meals = await findMealsNear(lat, lng, mealPL);
  if (meals.length < 3) {
    meals.push(...(await findMealsNear(lat, lng, [0,1,2,3,4], 6000)));
  }
  const [b,l,d] = [pick(meals,1)[0], pick(meals,1)[0], pick(meals,1)[0]];

  let activities = await findActivitiesNear(lat, lng, params.interests.length ? params.interests : ["landmarks","parks"] as any);
  if (activities.length < 2) {
    const extra = await nearbyPlaces({
      lat, lng, radiusMeters: 5000, includedTypes: ["tourist_attraction","park"], minRating: 4.0, maxResults: 20
    });
    activities = activities.concat(extra.map(e => ({...e, _category: "landmarks"})));
  }
  const [am, pm] = [activities[0], activities[1]];

  const breakfast = toActivity(b, "meal", "food", breakfastTime, 60, "breakfast");
  const lunch     = toActivity(l, "meal", "food", lunchTime, 60, "lunch");
  const dinner    = toActivity(d, "meal", "food", dinnerTime, 90, "dinner");

  const morning   = toActivity(am, "activity", am._category ?? "landmarks", addMinutes(breakfast.end!, 45), 120);
  const afternoon = toActivity(pm, "activity", pm._category ?? "culture",    addMinutes(lunch.end!, 45), 150);

  let evening: Activity | undefined;
  const subtotal =
    breakfast.estimatedCost + lunch.estimatedCost + dinner.estimatedCost +
    morning.estimatedCost + afternoon.estimatedCost;
  if (subtotal < perDay * 0.9) {
    const nightlife = await nearbyPlaces({
      lat, lng, radiusMeters: 3000, includedTypes: ["bar","night_club"], minRating: 4.2, maxResults: 10
    });
    if (nightlife[0]) {
      evening = toActivity(nightlife[0], "activity", "nightlife", addMinutes(dinner.end!, 30), 90);
    }
  }

  const totalEstimatedCost = Math.round(
    breakfast.estimatedCost + lunch.estimatedCost + dinner.estimatedCost +
    morning.estimatedCost + afternoon.estimatedCost + (evening?.estimatedCost ?? 0)
  );

  if (totalEstimatedCost > perDay && evening) {
    evening = undefined;
  }

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
    totalEstimatedCost: Math.min(perDay, totalEstimatedCost),
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
