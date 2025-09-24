import Constants from "expo-constants";
import type { PlaceLite, PriceLevel } from "../types";

const GOOGLE_KEY: string =
  (Constants?.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY ?? "";

type GeocodeKind = "country" | "locality" | "admin_area" | "unknown";

export async function geocodePlace(input: string): Promise<{
  kind: GeocodeKind;
  name: string;
  country?: string;
  countryCode?: string;
  lat: number;
  lng: number;
  placeId: string;
}> {
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    encodeURIComponent(input) +
    `&key=${GOOGLE_KEY}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.results?.[0]) {
    throw new Error("No geocoding results.");
  }
  const r = json.results[0];
  const types: string[] = r.types || [];
  const comps: any[] = r.address_components || [];

  let kind: GeocodeKind = "unknown";
  if (types.includes("country")) kind = "country";
  else if (types.includes("locality")) kind = "locality";
  else if (types.some((t) => t.startsWith("administrative_area_level")))
    kind = "admin_area";

  const countryComp = comps.find((c) => c.types?.includes("country"));
  const name =
    (types.includes("country") && countryComp?.long_name) ||
    r.formatted_address ||
    input;

  return {
    kind,
    name,
    country: countryComp?.long_name,
    countryCode: countryComp?.short_name,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    placeId: r.place_id,
  };
}

export async function nearbyPlaces(opts: {
  lat: number;
  lng: number;
  radiusMeters: number;
  includedTypes: string[];
  minRating?: number;
  priceLevels?: PriceLevel[];
  maxResults?: number;
}): Promise<PlaceLite[]> {
  const {
    lat,
    lng,
    radiusMeters,
    includedTypes,
    minRating = 4.1,
    priceLevels,
    maxResults = 12,
  } = opts;
  const endpoint = "https://places.googleapis.com/v1/places:searchNearby";

  const fieldMask =
    "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.googleMapsUri,places.types";

  const body = {
    includedTypes,
    maxResultCount: Math.min(maxResults, 20),
    locationRestriction: {
      circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Places error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const places = (json.places || []) as any[];

  const filtered = places
    .filter((p) => !minRating || (p.rating ?? 0) >= minRating)
    .filter((p) =>
      priceLevels && priceLevels.length
        ? priceLevels.includes(p.priceLevel as PriceLevel)
        : true
    )
    .map<PlaceLite>((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "Unknown",
      address: p.formattedAddress,
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      googleMapsUri:
        p.googleMapsUri ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          p.displayName?.text ?? ""
        )}&query_place_id=${encodeURIComponent(p.id)}`,
      rating: p.rating,
      userRatingsTotal: p.userRatingCount,
      priceLevel: p.priceLevel as PriceLevel | undefined,
      websiteUri: p.websiteUri,
      types: p.types,
    }));

  return filtered;
}

export async function getTravelTimeMinutes(args: {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  mode?: "driving" | "walking" | "bicycling" | "transit";
}): Promise<{ minutes: number; distanceKm?: number }> {
  const { from, to, mode = "transit" } = args;
  const url =
    "https://maps.googleapis.com/maps/api/distancematrix/json" +
    `?origins=${from.lat},${from.lng}` +
    `&destinations=${to.lat},${to.lng}` +
    `&mode=${mode}` +
    `&key=${GOOGLE_KEY}`;

  const res = await fetch(url);
  const json = await res.json();

  const el = json.rows?.[0]?.elements?.[0];
  if (el?.status !== "OK") {
    return { minutes: 0 };
  }
  const minutes = Math.round((el.duration?.value ?? 0) / 60);
  const distanceKm = Math.round((el.distance?.value ?? 0) / 1000);
  return { minutes, distanceKm };
}
