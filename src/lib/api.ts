// --- OpenAI Itinerary Generation ---
// import { OPENAI_API_KEY } from './env'; // Already imported below

export async function generateItineraryWithOpenAI({
  destination,
  startDate,
  endDate,
  preferences,
  travelers,
  budget,
  isCountryLevel = false,
}: {
  destination: string;
  startDate: string;
  endDate: string;
  preferences: string[];
  travelers: number;
  budget?: number;
  isCountryLevel?: boolean;
}) {
  // Build prompt for OpenAI
  const prompt = `You are a travel planner. Create a detailed, multi-day itinerary for a trip to ${destination} from ${startDate} to ${endDate} for ${travelers} traveler(s). Preferences: ${preferences.join(", ")}. Budget: ${budget ? `$${budget}` : 'flexible'}. ${isCountryLevel ? 'This is a country-level trip. Include multiple cities, logical routing, and specify the city for each day. For each day, list the city, all stops (meals, activities, shopping, etc.), and a short summary. Do not use fake or placeholder venues. Make sure the itinerary covers the best cities and routes in ${destination}, and that each stop is a real, well-known place with address and website if possible.' : 'For each day, list the city, stops (meals, activities, shopping, etc.), and a short summary. Do not use fake or placeholder venues.'}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a travel planner assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate itinerary with OpenAI');
  }
  const data = await response.json();
  // Parse and return the itinerary text
  const itineraryText = data.choices?.[0]?.message?.content || '';
  return itineraryText;
}

/**
 * Generate a multi-day itinerary for "Plan Your Trip" mode.
 * @param input - { city, startDate, endDate, preferences, budgetUsd, places, mealTimes, isCountry, countryCities }
 * @returns TripItinerary
 */

const preferenceToInterests: Record<PreferenceOption, Interest[]> = {
  Museums: ['museums', 'art'],
  Nature: ['parks'],
  Food: ['food'],
  Shopping: ['shopping'],
  Nightlife: ['nightlife'],
  Culture: ['culture', 'landmarks'],
  Relaxation: ['parks'],
  Family: ['museums', 'landmarks'],
};

const translatePreferencesToInterests = (preferences: PreferenceOption[]): Interest[] => {
  const mapped = new Set<Interest>();
  preferences.forEach((preference) => {
    const interests = preferenceToInterests[preference];
    if (interests) {
      interests.forEach((interest) => mapped.add(interest));
    }
  });
  if (mapped.size === 0) {
    mapped.add('landmarks');
    mapped.add('culture');
    mapped.add('food');
  }
  return Array.from(mapped);
};

const priceLevelToSymbol = (priceLevel?: number) => {
  if (priceLevel === 0) return 'Free';
  if (priceLevel === 1) return '$';
  if (priceLevel === 2) return '$$';
  if (priceLevel === 3) return '$$$';
  if (priceLevel === 4) return '$$$$';
  return '$$';
};

const minutesBetween = (start?: string, end?: string) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
};

const formatDurationLabel = (minutes?: number | null) => {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return 'Flexible';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs}h ${mins}m`;
  if (hrs) return `${hrs}h`;
  return `${mins}m`;
};

const formatTimeRange = (start?: string, end?: string) => {
  const formatTime = (iso?: string) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  if (!startLabel || !endLabel) return '';
  return `${startLabel} - ${endLabel}`;
};

const buildCandidateLookup = (places: PlaceCandidate[] = []): Map<string, PlaceCandidate> => {
  const lookup = new Map<string, PlaceCandidate>();
  places.forEach((place) => {
    if (!place) return;
    if (place.placeId) lookup.set(`id:${place.placeId}`, place);
    if (place.name) lookup.set(`name:${place.name.toLowerCase()}`, place);
  });
  return lookup;
};

const findCandidateForActivity = (
  activity: Activity,
  lookup: Map<string, PlaceCandidate>,
): PlaceCandidate | undefined => {
  if (activity.id && lookup.has(`id:${activity.id}`)) {
    return lookup.get(`id:${activity.id}`);
  }
  if (activity.name) {
    const byName = lookup.get(`name:${activity.name.toLowerCase()}`);
    if (byName) return byName;
  }
  return undefined;
};

type MapActivityToStopParams = {
  activity: Activity;
  label: string;
  dayIndex: number;
  date: string;
  category: ItineraryStop['category'];
  previousActivity?: Activity | null;
  candidateLookup: Map<string, PlaceCandidate>;
  isFirstStop: boolean;
};

const mapActivityToStop = ({
  activity,
  label,
  dayIndex,
  date,
  category,
  previousActivity,
  candidateLookup,
  isFirstStop,
}: MapActivityToStopParams): ItineraryStop => {
  const candidate = findCandidateForActivity(activity, candidateLookup);
  const estimatedCost = Number.isFinite(activity.estimatedCost) ? activity.estimatedCost : 0;
  const durationMinutes = minutesBetween(activity.start, activity.end);
  const travelGapMinutes =
    previousActivity?.end && activity.start
      ? minutesBetween(previousActivity.end, activity.start)
      : null;

  const travelLabel =
    isFirstStop || travelGapMinutes == null
      ? 'Start'
      : `~${formatDurationLabel(travelGapMinutes)} transfer`;

  const fallbackMapsUrl =
    activity.id && activity.name
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          activity.name,
        )}&query_place_id=${activity.id}`
      : '';

  return {
    dayIndex,
    date,
    title: label,
    description: activity.address ?? activity.notes ?? candidate?.address ?? '',
    google_maps_url:
      activity.googleMapsUri ??
      candidate?.googleMapsUrl ??
      fallbackMapsUrl,
    photo_url: candidate?.photoUrl ?? '',
    website_url: activity.websiteUri ?? candidate?.websiteUrl,
    estimated_cost: priceLevelToSymbol(activity.priceLevel),
    estimated_price_usd: Math.max(0, Math.round(estimatedCost)),
    duration: formatDurationLabel(durationMinutes),
    travel_time_from_previous: travelLabel,
    time_block: formatTimeRange(activity.start, activity.end),
    category,
    address: activity.address ?? candidate?.address,
  };
};

type ConvertDayPlanParams = {
  plan: EngineDayPlan;
  dayIndex: number;
  candidateLookup: Map<string, PlaceCandidate>;
  travelLeg?: TravelLeg | null;
};

const convertDayPlanToItineraryDay = ({
  plan,
  dayIndex,
  candidateLookup,
  travelLeg,
}: ConvertDayPlanParams): { day: ItineraryDay; highlights: string[] } => {
  const stops: ItineraryStop[] = [];
  const highlights: string[] = [];
  let previousActivity: Activity | null = null;
  let firstStart: Date | null = null;
  let lastEnd: Date | null = null;

  if (travelLeg) {
    const durationLabel = formatDurationLabel(travelLeg.durationMinutes);
    const descriptionParts = [`Take ${travelLeg.mode} from ${travelLeg.from} to ${travelLeg.to}`];
    if (travelLeg.distanceKm != null) {
      descriptionParts.push(`~${travelLeg.distanceKm} km`);
    }
    stops.push({
      dayIndex,
      date: plan.date,
      title: `Travel to ${travelLeg.to}`,
      description: descriptionParts.join(' • '),
      google_maps_url: '',
      photo_url: '',
      website_url: undefined,
      estimated_cost: 'Free',
      estimated_price_usd: 0,
      duration: `${durationLabel} journey`,
      travel_time_from_previous: 'Start',
      time_block: 'Flexible travel window',
      category: 'transport',
    });
    highlights.push(`Travel to ${travelLeg.to}`);
  }

  const segments: Array<{ activity?: Activity; label: string; category: ItineraryStop['category'] }> = [
    { activity: plan.breakfast, label: plan.breakfast ? `Breakfast at ${plan.breakfast.name}` : 'Breakfast', category: 'food' },
    { activity: plan.morning, label: plan.morning?.name ?? 'Morning discovery', category: 'activity' },
    { activity: plan.lunch, label: plan.lunch ? `Lunch at ${plan.lunch.name}` : 'Lunch', category: 'food' },
    { activity: plan.afternoon, label: plan.afternoon?.name ?? 'Afternoon highlight', category: 'activity' },
    { activity: plan.dinner, label: plan.dinner ? `Dinner at ${plan.dinner.name}` : 'Dinner', category: 'food' },
  ];

  if (plan.evening) {
    segments.push({
      activity: plan.evening,
      label: plan.evening.name,
      category: 'activity',
    });
  }

  segments.forEach(({ activity, label, category }) => {
    if (!activity) return;
    const stop = mapActivityToStop({
      activity,
      label,
      dayIndex,
      date: plan.date,
      category,
      previousActivity,
      candidateLookup,
      isFirstStop: stops.length === 0,
    });
    stops.push(stop);
    highlights.push(stop.title);
    previousActivity = activity;

    const startDate = activity.start ? new Date(activity.start) : null;
    const endDate = activity.end ? new Date(activity.end) : null;
    if (startDate && !Number.isNaN(startDate.getTime())) {
      if (!firstStart || startDate < firstStart) firstStart = startDate;
    }
    if (endDate && !Number.isNaN(endDate.getTime())) {
      if (!lastEnd || endDate > lastEnd) lastEnd = endDate;
    }
  });

  const estimatedSpend = stops.reduce(
    (total, stop) => total + (stop.estimated_price_usd ?? 0),
    0,
  );

  const totalMinutes =
    firstStart && lastEnd
      ? Math.max(0, Math.round((lastEnd.getTime() - firstStart.getTime()) / 60000))
      : null;

  const pace = stops.length >= 6 ? 'Energetic' : stops.length >= 4 ? 'Balanced' : 'Relaxed';

  const notesParts = [`Curated experiences in ${plan.city}`];
  if (plan.country && plan.country !== plan.city) {
    notesParts.push(plan.country);
  }
  const notes = `${notesParts.join(' • ')}. Meals and activities sequenced with travel buffers.`;

  return {
    day: {
      date: plan.date,
      city: plan.city,
      summary: {
        totalTime: formatDurationLabel(totalMinutes),
        pace,
        notes,
        stopsCount: stops.length,
        estimatedSpend,
      },
      stops,
    },
    highlights,
  };
};

export const generateTripItinerary = async (input: {
  city: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  preferences: PreferenceOption[];
  budgetUsd?: number;
  places: PlaceCandidate[];
  mealTimes?: { breakfast: string; lunch: string; dinner: string };
  isCountry?: boolean;
  countryCities?: string[]; // kept for compatibility
}): Promise<TripItinerary> => {
  const candidateLookup = buildCandidateLookup(input.places);
  const interests = translatePreferencesToInterests(input.preferences);

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const fallbackDayCount =
    Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
      ? 1
      : Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

  let tripPlan: EngineTripPlan;
  try {
    tripPlan = await engineCreateTripPlan({
      location: input.city,
      arrivalISO: input.startDate,
      departureISO: input.endDate,
      interests,
      budgetPerDay: input.budgetUsd,
    });
  } catch (error) {
    console.warn('Falling back to default itinerary builder', error);
    return buildFallbackItinerary(
      {
        tripName: `${input.city} Escape`,
        city: input.city,
        startDate: input.startDate,
        endDate: input.endDate,
        dayCount: fallbackDayCount,
        preferences: input.preferences,
        budgetUsd: input.budgetUsd,
      },
      input.places,
    );
  }

  if (!tripPlan.days.length) {
    return buildFallbackItinerary(
      {
        tripName: `${input.city} Escape`,
        city: input.city,
        startDate: input.startDate,
        endDate: input.endDate,
        dayCount: Math.max(tripPlan.totalNights ?? fallbackDayCount, 1),
        preferences: input.preferences,
        budgetUsd: input.budgetUsd,
      },
      input.places,
    );
  }

  const days: ItineraryDay[] = [];
  const highlights: string[] = [];
  let totalSpend = 0;

  const order = tripPlan.order ?? [];
  const travelLegs = tripPlan.travel ?? [];

  let stayIndex = 0;
  let dayInCurrentStay = 0;

  for (let i = 0; i < tripPlan.days.length; i++) {
    const plan = tripPlan.days[i];
    const currentStay = order[stayIndex];
    const isFirstDayInStay = dayInCurrentStay === 0;
    const travelLeg =
      isFirstDayInStay && stayIndex > 0 ? travelLegs[stayIndex - 1] : null;

    const { day, highlights: dayHighlights } = convertDayPlanToItineraryDay({
      plan,
      dayIndex: i,
      candidateLookup,
      travelLeg: travelLeg ?? null,
    });

    days.push(day);
    highlights.push(...dayHighlights);
    totalSpend += day.summary.estimatedSpend;

    dayInCurrentStay += 1;
    if (currentStay && dayInCurrentStay >= currentStay.nights) {
      stayIndex += 1;
      dayInCurrentStay = 0;
    }
  }

  const uniqueHighlights = Array.from(new Set(highlights)).slice(0, 12);
  const cityNames = order.map((stay) => stay.city);
  const destinationLabel =
    cityNames.length > 1 ? cityNames.join(' → ') : cityNames[0] ?? input.city;
  const tripName =
    cityNames.length > 1 && cityNames[0] && cityNames[cityNames.length - 1]
      ? `${cityNames[0]} to ${cityNames[cityNames.length - 1]} Grand Tour`
      : `${destinationLabel} Escape`;

  const dayCount = Math.max(days.length, tripPlan.totalNights ?? fallbackDayCount);
  const dailyBudget = input.budgetUsd ?? undefined;
  const totalBudget =
    dailyBudget != null ? dailyBudget * Math.max(dayCount, 1) : undefined;

  return {
    trip_name: tripName,
    destination: destinationLabel,
    start_date: input.startDate,
    end_date: input.endDate,
    currency: 'USD',
    conversion_rate: 1,
    base_currency: 'USD',
    budget_usd: totalBudget,
    daily_budget_usd: dailyBudget,
    total_estimated_cost: Math.round(totalSpend),
    highlights: uniqueHighlights,
    days,
  };
};

export const generateDayItinerary = async (input: {
  city: string;
  date: string; // ISO date string
  preferences: PreferenceOption[];
  budgetUsd?: number;
  places: PlaceCandidate[];
  mealTimes?: { breakfast: string; lunch: string; dinner: string };
}): Promise<TripItinerary> => {
  const candidateLookup = buildCandidateLookup(input.places);
  const interests = translatePreferencesToInterests(input.preferences);

  try {
    const plan = await engineCreateDayPlan({
      location: input.city,
      dateISO: input.date,
      interests,
      budgetPerDay: input.budgetUsd,
    });

    const { day, highlights } = convertDayPlanToItineraryDay({
      plan,
      dayIndex: 0,
      candidateLookup,
    });

    const spend = Math.round(day.summary.estimatedSpend);
    const dailyBudget = input.budgetUsd ?? spend;

    return {
      trip_name: `${input.city} Day Plan`,
      destination: input.city,
      start_date: input.date,
      end_date: input.date,
      currency: 'USD',
      conversion_rate: 1,
      base_currency: 'USD',
      budget_usd: dailyBudget,
      daily_budget_usd: dailyBudget,
      total_estimated_cost: spend,
      highlights: Array.from(new Set(highlights)),
      days: [day],
    };
  } catch (error) {
    console.warn('Falling back to simple day itinerary', error);
    return buildFallbackItinerary(
      {
        tripName: `${input.city} Day Plan`,
        city: input.city,
        startDate: input.date,
        endDate: input.date,
        dayCount: 1,
        preferences: input.preferences,
        budgetUsd: input.budgetUsd,
      },
      input.places,
    );
  }
};

import { Platform } from 'react-native';

import {
  PreferenceOption,
  ItineraryStop,
  TripItinerary,
  ItineraryDay,
} from '../types/plans';
import {
  Activity,
  DayPlan as EngineDayPlan,
  Interest,
  TripPlan as EngineTripPlan,
  TravelLeg,
} from '../types';
import {
  createDayPlan as engineCreateDayPlan,
  createTripPlan as engineCreateTripPlan,
} from '../engine/createPlan';
import { GOOGLE_API_KEY, OPENAI_API_KEY } from './env';

export type GeocodedLocation = {
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
  types: string[];
  country?: string;
  isCountry: boolean;
};

export type PlaceCandidate = {
  name: string;
  placeId: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  city?: string;
  country?: string;
  rating?: number;
  types?: string[];
  googleMapsUrl?: string;
  photoUrl?: string;
  websiteUrl?: string;
  priceLevel?: number;
};

export type WeatherDaySummary = {
  date: string;
  summary: string;
  highC: number | null;
  lowC: number | null;
  precipitationChance: number | null;
};

const PLACES_SEARCH_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const OPENAI_CHAT_COMPLETIONS_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MAX_PLACES_RADIUS_METERS = 50000;
const MAX_PLACE_RESULTS = 6;
const MAX_ITINERARY_PLACE_CANDIDATES = 6;
const DEFAULT_CURRENCY = 'USD';

const extractPlaceId = (resourceName?: string | null) => {
  if (!resourceName) return undefined;
  const parts = resourceName.split('/');
  return parts.length > 1 ? parts[1] : resourceName;
};

const buildPhotoUrl = (photoName?: string | null) => {
  if (!photoName || !GOOGLE_API_KEY) return undefined;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&key=${GOOGLE_API_KEY}`;
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Request failed: ${response.status} ${message}`);
  }
  return (await response.json()) as T;
};

const callPlacesSearch = async (
  textQuery: string,
  options?: { locationBias?: { latitude: number; longitude: number; radiusMeters?: number } },
) => {
  if (!GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY is not configured. Skipping Places lookup.');
    return [] as any[];
  }

  const body: Record<string, unknown> = { textQuery };
  if (options?.locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: options.locationBias.latitude,
          longitude: options.locationBias.longitude,
        },
        radius: Math.min(
          Math.max(options.locationBias.radiusMeters ?? MAX_PLACES_RADIUS_METERS, 1000),
          MAX_PLACES_RADIUS_METERS,
        ),
      },
    };
  }

  try {
    const response = await fetch(PLACES_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': [
          'places.name',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.primaryType',
          'places.types',
          'places.websiteUri',
          'places.googleMapsUri',
          'places.priceLevel',
          'places.photos',
        ].join(','),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Google Places request failed: ${response.status} ${message}`);
    }

    const payload = (await response.json()) as {
      places?: Array<{
        name?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        rating?: number;
        types?: string[];
        primaryType?: string;
        location?: { latitude?: number; longitude?: number };
        websiteUri?: string;
        googleMapsUri?: string;
        priceLevel?: number;
        photos?: Array<{ name?: string }>;
      }>;
    };

    return payload.places ?? [];
  } catch (error) {
    console.warn('Places search failed', error);
    return [];
  }
};

const extractCountryFromAddress = (address?: string) => {
  if (!address) return undefined;
  const segments = address
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : undefined;
};

const extractCityFromAddress = (address?: string) => {
  if (!address) return undefined;
  const segments = address
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length <= 1) return segments[0];
  if (segments.length === 2) return segments[0];
  return segments[segments.length - 2];
};

export const geocodeCity = async (city: string): Promise<GeocodedLocation> => {
  const results = await callPlacesSearch(city);
  const [firstResult] = results;

  if (!firstResult?.location?.latitude || !firstResult.location.longitude) {
    console.warn('Falling back to basic geocode for destination', city);
    const fallbackSegments = city.split(',').map((segment) => segment.trim()).filter(Boolean);
    const fallbackCity = fallbackSegments[0] ?? city;
    const fallbackCountry = fallbackSegments.length > 1
      ? fallbackSegments[fallbackSegments.length - 1]
      : undefined;

    return {
      city: fallbackCity,
      address: city,
      latitude: 0,
      longitude: 0,
      placeId: city,
      types: [],
      country: fallbackCountry,
      isCountry: false,
    };
  }

  const placeId = extractPlaceId(firstResult.name) ?? city;
  const placeTypes = firstResult.types ?? [];
  const primaryType = firstResult.primaryType ?? '';
  const resolvedName = firstResult.displayName?.text ?? city;
  const formattedAddress = firstResult.formattedAddress ?? resolvedName;
  const isCountry =
  placeTypes.some((type: string) => type?.toLowerCase() === 'country') || primaryType === 'country';
  const countryName = isCountry ? resolvedName : extractCountryFromAddress(formattedAddress);

  return {
    city: resolvedName,
    address: formattedAddress,
    latitude: firstResult.location.latitude,
    longitude: firstResult.location.longitude,
    placeId,
    types: placeTypes,
    country: countryName,
    isCountry,
  };
};

const buildPreferenceQuery = (preference: PreferenceOption, city: string) => {
  const preferenceLabel = preference.toLowerCase();
  return `${preferenceLabel} in ${city}`;
};

const mapTypesToCategory = (types?: string[]): ItineraryStop['category'] => {
  if (!types || types.length === 0) return 'activity';
  const lowered = types.map((type) => type.toLowerCase());
  if (lowered.some((type) => type.includes('restaurant') || type.includes('food'))) {
    return 'food';
  }
  if (lowered.some((type) => type.includes('bar') || type.includes('cafe'))) {
    return 'break';
  }
  if (lowered.some((type) => type.includes('transit') || type.includes('station'))) {
    return 'transport';
  }
  if (lowered.some((type) => type.includes('museum') || type.includes('tourist_attraction'))) {
    return 'activity';
  }
  return 'misc';
};

export const fetchPreferencePlaces = async (
  city: string,
  preferences: PreferenceOption[],
  location: GeocodedLocation,
): Promise<PlaceCandidate[]> => {
  const uniquePlaces = new Map<string, PlaceCandidate>();
  const activePreferences: PreferenceOption[] = preferences.length > 0 ? preferences : ['Culture'];

  await Promise.all(
    activePreferences.map(async (preference) => {
      const queryRegion = location.isCountry ? location.country ?? city : city;
      const searchQuery = buildPreferenceQuery(preference, queryRegion);
      const searchOptions = location.isCountry
        ? undefined
        : {
            locationBias: {
              latitude: location.latitude,
              longitude: location.longitude,
              radiusMeters: MAX_PLACES_RADIUS_METERS,
            },
          };

      let places: any[] = [];
      try {
        places = await callPlacesSearch(searchQuery, searchOptions);
      } catch (error) {
        console.warn('Preference place lookup failed', error);
        return;
      }

      const placeList = Array.isArray(places) ? places : [];

      placeList.slice(0, MAX_PLACE_RESULTS).forEach((place) => {
        const placeId = extractPlaceId(place.name) ?? place.displayName?.text;
        if (!placeId || uniquePlaces.has(placeId)) {
          return;
        }

        const photoUrl = place.photos?.[0]?.name
          ? buildPhotoUrl(place.photos[0].name)
          : undefined;

        const formattedAddress = place.formattedAddress ?? queryRegion;
        const countryName =
          extractCountryFromAddress(formattedAddress) ??
          location.country ??
          queryRegion;
        const cityName = location.isCountry
          ? extractCityFromAddress(formattedAddress)
          : location.city ?? extractCityFromAddress(formattedAddress);

        uniquePlaces.set(placeId, {
          name: place.displayName?.text ?? 'Point of interest',
          placeId,
          address: formattedAddress,
          location: {
            lat: place.location?.latitude ?? location.latitude,
            lng: place.location?.longitude ?? location.longitude,
          },
          city: cityName ?? undefined,
          country: countryName ?? undefined,
          rating: place.rating,
          types: place.types,
          googleMapsUrl: place.googleMapsUri,
          photoUrl,
          websiteUrl: place.websiteUri,
          priceLevel: place.priceLevel,
        });
      });
    }),
  );

  return Array.from(uniquePlaces.values()).slice(0, 16);
};

const weatherCodeToSummary = (code: number | null | undefined) => {
  if (code == null) return 'Mixed conditions';
  if (code == 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorms';
  return 'Varied weather';
};

export const fetchWeatherForecastRange = async (
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
): Promise<WeatherDaySummary[]> => {
  const maxDays = 14;
  const isoStart = startDate.toISOString().slice(0, 10);
  const computedEnd = new Date(startDate);
  const totalDays = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000));
  computedEnd.setDate(computedEnd.getDate() + Math.min(maxDays, totalDays));
  const isoEnd = computedEnd.toISOString().slice(0, 10);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${isoStart}&end_date=${isoEnd}`;

  try {
    const data = await fetchJson<any>(url);
    const dailyWeather = data.daily ?? {};
    const dates: string[] = Array.isArray(dailyWeather.time) ? dailyWeather.time : [];
    const codes: any[] = Array.isArray(dailyWeather.weathercode)
      ? dailyWeather.weathercode
      : [];
    const highs: any[] = Array.isArray(dailyWeather.temperature_2m_max)
      ? dailyWeather.temperature_2m_max
      : [];
    const lows: any[] = Array.isArray(dailyWeather.temperature_2m_min)
      ? dailyWeather.temperature_2m_min
      : [];
    const precip: any[] = Array.isArray(dailyWeather.precipitation_probability_max)
      ? dailyWeather.precipitation_probability_max
      : [];

    return dates.map((date, index) => ({
      date,
      summary: weatherCodeToSummary(codes[index] ?? null),
      highC: highs[index] ?? null,
      lowC: lows[index] ?? null,
      precipitationChance: precip[index] != null ? precip[index] / 100 : null,
    }));
  } catch (error) {
    console.warn('Weather lookup failed', error);
    return [];
  }
};

const sanitiseJsonResponse = (content: string | null | unknown) => {
  if (typeof content !== 'string') return null;
  const trimmed = content.trim();
  const jsonBlockMatch = trimmed.match(/```json([\s\S]*?)```/i);
  const jsonString = jsonBlockMatch ? jsonBlockMatch[1] : trimmed;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON response from OpenAI', error);
    return null;
  }
};

const normaliseDay = (
  day: any,
  dayIndex: number,
  fallbackDate: string,
  candidateMap: Map<string, PlaceCandidate>,
): ItineraryDay => {
  const date =
    typeof day?.date === 'string' && day.date.length > 0 ? day.date : fallbackDate;
  const stopsArray: any[] = Array.isArray(day?.stops) ? day.stops : [];

  const stops: ItineraryStop[] = stopsArray.map((entry, index) => {
    const title = String(entry.title ?? entry.name ?? `Experience ${index + 1}`);
    const matchedCandidate = Array.from(candidateMap.values()).find(
      (candidate) =>
        candidate.name.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(candidate.name.toLowerCase()),
    );

    const costValue = Number(entry.estimated_price_usd ?? entry.estimatedPriceUsd ?? 0);
    const googleMapsUrl =
      entry.google_maps_url ??
      entry.googleMapsUrl ??
      matchedCandidate?.googleMapsUrl ??
      (matchedCandidate
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(matchedCandidate.name)}&query_place_id=${matchedCandidate.placeId}`
        : '');

    const explicitCategory = (entry.category as ItineraryStop['category']) ?? undefined;
    const candidateCategory = matchedCandidate?.types
      ? mapTypesToCategory(matchedCandidate.types)
      : 'activity';
    const resolvedCategory = explicitCategory ?? candidateCategory;

    return {
      dayIndex,
      date,
      title,
      description: String(entry.description ?? entry.details ?? ''),
      google_maps_url: googleMapsUrl,
      photo_url: entry.photo_url ?? entry.photoUrl ?? matchedCandidate?.photoUrl ?? '',
      website_url: entry.website_url ?? entry.websiteUrl ?? matchedCandidate?.websiteUrl,
      estimated_cost: String(entry.estimated_cost ?? entry.price_tier ?? '$$'),
      estimated_price_usd: Number.isFinite(costValue) ? Number(costValue) : 0,
      duration: String(entry.duration ?? entry.duration_text ?? '1 hour'),
      travel_time_from_previous: String(
        entry.travel_time_from_previous ??
          entry.travelTime ??
          (index === 0 ? 'Start' : '15 min'),
      ),
      time_block: String(entry.time_block ?? entry.time ?? ''),
      category: resolvedCategory,
    } satisfies ItineraryStop;
  });

  const estimatedSpend = stops.reduce(
    (total, stop) => total + (stop.estimated_price_usd ?? 0),
    0,
  );

  return {
    date,
    summary: {
      totalTime: String(day?.summary?.totalTime ?? 'Full-day adventure'),
      pace: String(day?.summary?.pace ?? 'Balanced pace with breaks'),
      notes: String(
        day?.summary?.notes ??
          'Expect a mix of iconic stops and local gems tailored to your preferences.',
      ),
      stopsCount: stops.length,
      estimatedSpend,
    },
    stops,
  };
};

const buildFallbackItinerary = (
  input: {
    tripName: string;
    city: string;
    startDate: string;
    endDate: string;
    dayCount: number;
    preferences: PreferenceOption[];
    budgetUsd?: number;
  },
  places: PlaceCandidate[],
): TripItinerary => {
  const { tripName, city, startDate, endDate, dayCount, budgetUsd } = input;
  const start = new Date(startDate);
  const totalDays = Math.max(dayCount, 1);

  const days: ItineraryDay[] = Array.from({ length: totalDays }).map((_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    const dayLabel = date.toISOString().slice(0, 10);
    const candidate = places[index % Math.max(places.length, 1)];

    const stop: ItineraryStop = {
      dayIndex: index,
      date: dayLabel,
      title: candidate?.name ?? `${city} experience ${index + 1}`,
      description: candidate?.address ?? 'Curated activity based on your preferences.',
      google_maps_url:
        candidate?.googleMapsUrl ??
        (candidate
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(candidate.name)}&query_place_id=${candidate.placeId}`
          : ''),
      photo_url: candidate?.photoUrl ?? '',
      website_url: candidate?.websiteUrl,
      estimated_cost: '$$',
      estimated_price_usd: 50,
      duration: '1 hour 30 min',
      travel_time_from_previous: index === 0 ? 'Start' : '15 min walk',
      time_block: index === 0 ? '09:00 - 10:30' : '11:00 - 12:30',
      category: candidate?.types ? mapTypesToCategory(candidate.types) : 'activity',
    };

    return {
      date: dayLabel,
      summary: {
        totalTime: 'Flexible day',
        pace: 'Balanced pace with breaks',
        notes: 'Auto-generated itinerary. Edit to refine your plan.',
        stopsCount: 1,
        estimatedSpend: stop.estimated_price_usd,
      },
      stops: [stop],
    };
  });

  const totalCost = days.reduce((total, day) => total + day.summary.estimatedSpend, 0);

  return {
    trip_name: tripName,
    destination: city,
    start_date: startDate,
    end_date: endDate,
    budget_usd: budgetUsd,
    total_estimated_cost: totalCost,
    highlights: [],
    days,
    currency: DEFAULT_CURRENCY,
    conversion_rate: 1,
    base_currency: 'USD',
  };
};

export const requestMultiDayItinerary = async (input: {
  tripName: string;
  city: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  preferences: PreferenceOption[];
  budgetUsd?: number;
  places?: PlaceCandidate[];
  weatherByDay?: WeatherDaySummary[];
  originalQuery?: string;
}): Promise<TripItinerary> => {
  const places = input.places ?? [];
  const weatherByDay = input.weatherByDay ?? [];
  const limitedPlaces = (Array.isArray(places) ? places : []).slice(0, MAX_ITINERARY_PLACE_CANDIDATES);

  const candidateSummaries = limitedPlaces
    .map((place, index) => {
      const mapsUrl =
        place.googleMapsUrl ??
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`;
      return `${index + 1}. ${place.name} - ${place.address}`;
    })
    .join('\n');

  const weatherSummary = weatherByDay
    .map(
      (day) =>
        `${day.date}: ${day.summary}`,
    )
    .join(' | ');

  if (!OPENAI_API_KEY) {
    return buildFallbackItinerary(input, limitedPlaces);
  }

  const prompt = `Plan a ${input.dayCount}-day itinerary called "${input.tripName}" for a traveler exploring ${input.city} from ${input.startDate} to ${input.endDate}. Budget: ${
    input.budgetUsd != null ? `$${input.budgetUsd.toFixed(0)} per day goal` : 'flexible'
  }.
Preferences: ${input.preferences.length > 0 ? input.preferences.join(', ') : 'general sightseeing'}.
Weather outlook: ${weatherSummary || 'General clear skies'}.

Suggested places:
${candidateSummaries}`;

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You are PlanGenie, an assistant that builds vibrant, budget-aware multi-day travel itineraries. Always respond with pure JSON matching the provided schema.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${message}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content as string | undefined;
    const parsed = sanitiseJsonResponse(content);
    if (!parsed) {
      throw new Error('Could not parse itinerary from OpenAI response.');
    }

    const candidateMap = new Map<string, PlaceCandidate>();
    limitedPlaces.forEach((place) => {
      candidateMap.set(place.placeId, place);
      candidateMap.set(place.name.toLowerCase(), place);
    });

    const rawDays: any[] = Array.isArray(parsed.days) ? parsed.days : [];
    const normalisedDays = rawDays.map((day, index) =>
      normaliseDay(day, index, weatherByDay[index]?.date ?? input.startDate, candidateMap),
    );

    const totalCost = normalisedDays.reduce(
      (total, day) => total + day.summary.estimatedSpend,
      0,
    );

    const itinerary: TripItinerary = {
      trip_name: parsed.trip_name ?? input.tripName,
      destination: parsed.destination ?? input.city,
      start_date: parsed.start_date ?? input.startDate,
      end_date: parsed.end_date ?? input.endDate,
      budget_usd: parsed.budget_usd ?? input.budgetUsd,
      total_estimated_cost: parsed.total_estimated_cost ?? totalCost,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      weatherSummary: parsed.weatherSummary ?? weatherSummary,
      days: normalisedDays,
      currency: DEFAULT_CURRENCY,
      conversion_rate: 1,
      base_currency: 'USD',
    };

    return itinerary;
  } catch (error) {
    console.warn('OpenAI itinerary generation failed', error);
    return buildFallbackItinerary(input, limitedPlaces);
  }
};

export const requestStopReplacement = async (input: {
  city: string;
  date: string;
  daySummary: { totalTime: string; pace: string; notes: string; estimatedSpend: number };
  existingStops: ItineraryStop[];
  replaceIndex: number;
  preferences: PreferenceOption[];
  budgetUsd?: number;
}): Promise<ItineraryStop> => {
  const {
    city,
    date,
    daySummary,
    existingStops,
    replaceIndex,
    preferences,
    budgetUsd,
  } = input;

  const targetStop = existingStops[replaceIndex];
  if (!targetStop) {
    throw new Error('Invalid stop selected for replacement.');
  }

  if (!OPENAI_API_KEY) {
    return targetStop;
  }

  const stopsOverview = existingStops
    .map(
      (stop, index) =>
        `${index + 1}. ${stop.title} (${stop.category}) at ${stop.time_block ?? 'flex'} - ${stop.description}`,
    )
    .join('\n');

  const prompt = `We are updating an itinerary in ${city} on ${date}.

Current day summary: pace=${daySummary.pace}; notes=${daySummary.notes}; budget guidance=${
    budgetUsd != null ? `$${budgetUsd.toFixed(0)} per day` : 'flexible'
  }.

Current stops:
${stopsOverview}

Replace entry #${
    replaceIndex + 1
  } with a new recommendation of the same category (${targetStop.category}). Respond with strict JSON containing title, description, google_maps_url, photo_url, website_url, estimated_cost (use $, $$, $$$), estimated_price_usd (number), duration, travel_time_from_previous, time_block, and category.`;

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You are PlanGenie, an assistant updating a single itinerary stop. Always return pure JSON with the requested fields.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${message}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content as string | undefined;
    const parsed = sanitiseJsonResponse(content);
    if (!parsed) {
      throw new Error('Could not parse replacement stop.');
    }

    const estimatedPrice = Number(parsed.estimated_price_usd ?? parsed.estimatedPriceUsd);
    const title = String(parsed.title ?? targetStop.title);

    const placeLookupQuery = `${title} ${city}`.trim();
    let googleMapsUrl = parsed.google_maps_url ?? parsed.googleMapsUrl ?? targetStop.google_maps_url;
    let photoUrl = parsed.photo_url ?? parsed.photoUrl ?? targetStop.photo_url;
    let websiteUrl = parsed.website_url ?? parsed.websiteUrl ?? targetStop.website_url;

    if ((!googleMapsUrl || !photoUrl || !websiteUrl) && GOOGLE_API_KEY) {
      try {
        const candidates = await callPlacesSearch(placeLookupQuery);
        const matched =
          candidates.find((place) => {
            const displayName = place.displayName?.text ?? place.name ?? '';
            return displayName.toLowerCase().includes(title.toLowerCase());
          }) ?? candidates[0];

        if (matched) {
          const candidatePhoto = matched.photos?.[0]?.name
            ? buildPhotoUrl(matched.photos[0].name)
            : undefined;
          if (candidatePhoto && !photoUrl) {
            photoUrl = candidatePhoto;
          }

          if (!googleMapsUrl) {
            const placeId = extractPlaceId(matched.name) ?? matched.displayName?.text;
            if (matched.googleMapsUri) {
              googleMapsUrl = matched.googleMapsUri;
            } else if (placeId) {
              const label = matched.displayName?.text ?? title;
              googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}&query_place_id=${placeId}`;
            }
          }

          if (!websiteUrl && matched.websiteUri) {
            websiteUrl = matched.websiteUri;
          }
        }
      } catch (lookupError) {
        console.warn('Failed to enrich replacement stop with Places data', lookupError);
      }
    }

    const replacement: ItineraryStop = {
      ...targetStop,
      title,
      description: parsed.description ?? targetStop.description,
      google_maps_url: googleMapsUrl,
      photo_url: photoUrl,
      website_url: websiteUrl,
      estimated_cost:
        parsed.estimated_cost ?? parsed.price_tier ?? targetStop.estimated_cost,
      estimated_price_usd: Number.isFinite(estimatedPrice)
        ? Number(estimatedPrice)
        : targetStop.estimated_price_usd,
      duration: parsed.duration ?? targetStop.duration,
      travel_time_from_previous:
        parsed.travel_time_from_previous ??
        parsed.travelTime ??
        targetStop.travel_time_from_previous,
      time_block: parsed.time_block ?? parsed.time ?? targetStop.time_block,
      category:
        (parsed.category as ItineraryStop['category']) ?? targetStop.category ?? 'activity',
      dayIndex: targetStop.dayIndex,
      date: targetStop.date,
    };

    return replacement;
  } catch (error) {
    console.warn('Failed to request stop replacement', error);
    return targetStop;
  }
};

export const optimisePlaceOrder = async (
  places: PlaceCandidate[],
): Promise<PlaceCandidate[]> => {
  const placeList = Array.isArray(places) ? places : [];
  if (Platform.OS === 'web' || placeList.length <= 2) {
    return placeList;
  }

  return placeList;
};








