export type PreferenceOption =
  | 'Museums'
  | 'Nature'
  | 'Food'
  | 'Shopping'
  | 'Nightlife'
  | 'Culture'
  | 'Relaxation'
  | 'Family';

export type PlannerFormValues = {
  city: string;
  startDate: Date;
  endDate: Date;
  isDayPlan: boolean;
  preferences: PreferenceOption[];
  budgetUsd?: number;
};

export type ItineraryStopCategory = 'food' | 'activity' | 'transport' | 'break' | 'misc';

export type ItineraryStop = {
  dayIndex: number;
  date: string;
  title: string;
  google_place_id?: string;
  description: string;
  google_maps_url: string;
  photo_url: string;
  website_url?: string;
  estimated_cost: string;
  estimated_price_usd: number;
  duration: string;
  address?: string;
  travel_time_from_previous: string;
  time_block: string;
  category: ItineraryStopCategory;
};

export type ItineraryDay = {
  date: string;
  city?: string;
  summary: {
    totalTime: string;
    pace: string;
    notes: string;
    stopsCount: number;
    estimatedSpend: number;
  };
  stops: ItineraryStop[];
};

export type TripItinerary = {
  trip_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  currency: string;
  conversion_rate: number; // relative to USD
  base_currency: 'USD';
  budget_usd?: number;
  budget_converted?: number;
  total_estimated_cost: number;
  highlights: string[];
  weatherSummary?: string;
  days: ItineraryDay[];
};

export type SavedItineraryRecord = {
  id: string;
  user_id: string;
  trip_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  itinerary_data: TripItinerary;
  created_at: string;
};

