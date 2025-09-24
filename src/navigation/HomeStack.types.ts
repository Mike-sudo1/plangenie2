import { TripItinerary } from '../types/plans';

export type HomeStackParamList = {
  Home: undefined;
  DayPlanner: {
    selectedDate: string;
  };
  PlanDetails: {
    itinerary: TripItinerary;
    planId?: string;
  };
};
