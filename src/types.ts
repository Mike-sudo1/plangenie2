export type Interest =
  | "food"
  | "culture"
  | "museums"
  | "parks"
  | "art"
  | "landmarks"
  | "shopping"
  | "nightlife";

export type PriceLevel = 0 | 1 | 2 | 3 | 4; // Google priceLevel (FREE=0,...VERY_EXPENSIVE=4)

export interface PlaceLite {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  googleMapsUri: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: PriceLevel;
  websiteUri?: string;
  types?: string[];
  city?: string;
  country?: string;
}

export interface Activity extends PlaceLite {
  kind: "meal" | "activity" | "travel";
  start?: string;
  end?: string;
  estimatedCost: number;
  notes?: string;
}

export interface DayPlan {
  date: string;
  city: string;
  country?: string;
  breakfast: Activity;
  morning: Activity;
  lunch: Activity;
  afternoon: Activity;
  dinner: Activity;
  evening?: Activity;
  totalEstimatedCost: number;
}

export interface CityStay {
  city: string;
  country: string;
  lat: number;
  lng: number;
  nights: number;
}

export interface TravelLeg {
  from: string;
  to: string;
  mode: "driving" | "transit" | "flying";
  durationMinutes: number;
  distanceKm?: number;
}

export interface TripPlan {
  order: CityStay[];
  travel: TravelLeg[];
  days: DayPlan[];
  totalNights: number;
}
