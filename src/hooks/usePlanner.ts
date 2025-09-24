import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, differenceInCalendarDays, formatISO } from 'date-fns';

import {
  fetchPreferencePlaces,
  fetchWeatherForecastRange,
  geocodeCity,
  requestMultiDayItinerary,
  requestStopReplacement,
  generateDayItinerary,
  generateTripItinerary,
} from '../lib/api';
import { usePlanningSettings } from '../providers/PlanningSettingsProvider';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useCurrency } from '../providers/CurrencyProvider';
import { PlannerFormValues, PreferenceOption, TripItinerary } from '../types/plans';

const LAST_DESTINATION_KEY = 'plangenie.last-destination';

const createDefaultForm = (): PlannerFormValues => ({
  city: '',
  startDate: new Date(),
  endDate: addDays(new Date(), 1),
  isDayPlan: false,
  preferences: [],
  budgetUsd: undefined,
});

type MutatingStopState = {
  dayIndex: number;
  stopIndex: number;
} | null;

const cloneItinerary = (itinerary: TripItinerary): TripItinerary =>
  JSON.parse(JSON.stringify(itinerary)) as TripItinerary;

const sumStops = (stops: TripItinerary['days'][number]['stops']) =>
  stops.reduce((total, stop) => total + (stop.estimated_price_usd ?? 0), 0);

const usePlanner = () => {
  const { user } = useAuth();
  const { currency, convertFromUsd, getRate } = useCurrency();
  const { mealTimes } = usePlanningSettings();

  const [form, setForm] = useState<PlannerFormValues>(createDefaultForm());
  const [baseItinerary, setBaseItinerary] = useState<TripItinerary | null>(null);
  const [displayItinerary, setDisplayItinerary] = useState<TripItinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mutatingStop, setMutatingStop] = useState<MutatingStopState>(null);

  const updateField = useCallback(
    <K extends keyof PlannerFormValues>(key: K, value: PlannerFormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const togglePreference = useCallback((preference: PreferenceOption) => {
    setForm((prev) => {
      const isSelected = prev.preferences.includes(preference);
      return {
        ...prev,
        preferences: isSelected
          ? prev.preferences.filter((value) => value !== preference)
          : [...prev.preferences, preference],
      };
    });
  }, []);

  const canSubmit = useMemo(() => {
    const hasCity = form.city.trim().length > 1;
    const validBudget = form.budgetUsd == null || form.budgetUsd >= 0;
    const dateDiff = differenceInCalendarDays(form.endDate, form.startDate);
    return hasCity && validBudget && dateDiff >= 0;
  }, [form.city, form.budgetUsd, form.endDate, form.startDate]);

  const convertItineraryForDisplay = useCallback(
    (source: TripItinerary | null): TripItinerary | null => {
      if (!source) return null;
      const convertValue = (amount: number) => convertFromUsd(amount);

      const convertedDays = source.days.map((day) => ({
        ...day,
        summary: {
          ...day.summary,
          estimatedSpend: convertValue(day.summary.estimatedSpend),
        },
        stops: day.stops.map((stop) => ({
          ...stop,
          estimated_price_usd: convertValue(stop.estimated_price_usd),
        })),
      }));

      return {
        ...source,
        currency,
        conversion_rate: getRate(),
        base_currency: 'USD',
        total_estimated_cost: convertValue(source.total_estimated_cost),
        budget_converted:
          source.budget_usd != null ? convertValue(source.budget_usd) : undefined,
        daily_budget_converted:
          source.daily_budget_usd != null ? convertValue(source.daily_budget_usd) : undefined,
        days: convertedDays,
      };
    },
    [convertFromUsd, currency, getRate],
  );

  useEffect(() => {
    if (baseItinerary) {
      setDisplayItinerary(convertItineraryForDisplay(baseItinerary));
    }
  }, [baseItinerary, convertItineraryForDisplay]);

  const submit = useCallback(async () => {
    if (!canSubmit || loading) return;

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const trimmedCity = form.city.trim();
      const geocoded = await geocodeCity(trimmedCity);
      const preferences = form.preferences;
      const budgetUsd = form.budgetUsd;
      const isDayPlan = form.isDayPlan;
      const startDate = form.startDate;
      const endDate = isDayPlan ? form.startDate : form.endDate;
      const startIso = formatISO(startDate, { representation: 'date' });
      const endIso = formatISO(endDate, { representation: 'date' });
      const dayCount = differenceInCalendarDays(endDate, startDate) + 1;
      const preferenceScope = geocoded.isCountry ? geocoded.country ?? geocoded.city : geocoded.city;

      const places = await fetchPreferencePlaces(preferenceScope, preferences, geocoded);

      let generated: TripItinerary;
      if (isDayPlan) {
        generated = await generateDayItinerary({
          city: geocoded.city,
          date: startIso,
          preferences,
          budgetUsd,
          places,
          mealTimes,
        });
        generated.trip_name = `${geocoded.city} Day Plan`;
      } else {
        // If country, try to get a list of major cities for multi-city logic (stub: just use city for now)
        let countryCities: string[] | undefined = undefined;
        if (geocoded.isCountry) {
          // TODO: Replace with real city list for the country
          countryCities = [geocoded.city];
        }
        generated = await generateTripItinerary({
          city: geocoded.city,
          startDate: startIso,
          endDate: endIso,
          preferences,
          budgetUsd,
          places,
          mealTimes,
          isCountry: geocoded.isCountry,
          countryCities,
        });
        generated.trip_name = geocoded.isCountry ? `${geocoded.city} Grand Tour` : `${geocoded.city} Escape`;
      }
      generated.currency = 'USD';
      generated.conversion_rate = 1;
      generated.base_currency = 'USD';

      setBaseItinerary(generated);
      setDisplayItinerary(convertItineraryForDisplay(generated));
      setMutatingStop(null);

      try {
        await AsyncStorage.setItem(LAST_DESTINATION_KEY, geocoded.city);
      } catch (storageError) {
        console.warn('Failed to persist last destination', storageError);
      }
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'We could not generate your itinerary. Try again.';
      setError(message);
      setBaseItinerary(null);
      setDisplayItinerary(null);
    } finally {
      setLoading(false);
    }
  }, [canSubmit, convertItineraryForDisplay, form, loading]);

  const saveItinerary = useCallback(
    async (tripName: string) => {
      if (!user) {
        setError('Please sign in to save your trip.');
        return;
      }
      if (!baseItinerary) {
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const updatedBase = { ...baseItinerary, trip_name: tripName };
        setBaseItinerary(updatedBase);
        const display = convertItineraryForDisplay(updatedBase);
        setDisplayItinerary(display);

        const { error: dbError } = await supabase.from('itineraries').insert({
          user_id: user.id,
          trip_name: tripName,
          destination: display?.destination,
          start_date: display?.start_date,
          end_date: display?.end_date,
          itinerary_data: display,
        });

        if (dbError) {
          throw dbError;
        }

        setSuccessMessage('Trip saved to your library!');
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : 'We could not save this trip right now.';
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [baseItinerary, convertItineraryForDisplay, user],
  );

  const removeStop = useCallback(
    (dayIndex: number, stopIndex: number) => {
      if (!baseItinerary) return;
      const updatedBase = cloneItinerary(baseItinerary);
      const day = updatedBase.days[dayIndex];
      if (!day) return;

      day.stops.splice(stopIndex, 1);
      day.summary.stopsCount = day.stops.length;
      day.summary.estimatedSpend = sumStops(day.stops);
      updatedBase.total_estimated_cost = updatedBase.days.reduce(
        (total, currentDay) => total + sumStops(currentDay.stops),
        0,
      );

      setBaseItinerary(updatedBase);
      setDisplayItinerary(convertItineraryForDisplay(updatedBase));
      setSuccessMessage(null);
    },
    [baseItinerary, convertItineraryForDisplay],
  );

  const replaceStop = useCallback(
    async (dayIndex: number, stopIndex: number) => {
      if (!baseItinerary) return;
      const targetDay = baseItinerary.days[dayIndex];
      if (!targetDay) return;

      setMutatingStop({ dayIndex, stopIndex });
      setError(null);

      try {
        const replacement = await requestStopReplacement({
          city: baseItinerary.destination,
          date: targetDay.date,
          daySummary: targetDay.summary,
          existingStops: targetDay.stops,
          replaceIndex: stopIndex,
          preferences: form.preferences,
          budgetUsd: form.budgetUsd,
        });

        const updatedBase = cloneItinerary(baseItinerary);
        updatedBase.days[dayIndex].stops[stopIndex] = replacement;
        updatedBase.days[dayIndex].summary.estimatedSpend = sumStops(
          updatedBase.days[dayIndex].stops,
        );
        updatedBase.days[dayIndex].summary.stopsCount =
          updatedBase.days[dayIndex].stops.length;
        updatedBase.total_estimated_cost = updatedBase.days.reduce(
          (total, currentDay) => total + sumStops(currentDay.stops),
          0,
        );

        setBaseItinerary(updatedBase);
        setDisplayItinerary(convertItineraryForDisplay(updatedBase));
        setSuccessMessage(null);
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : 'We could not update this stop. Try again.';
        setError(message);
      } finally {
        setMutatingStop(null);
      }
    },
    [baseItinerary, convertItineraryForDisplay, form.budgetUsd, form.preferences],
  );

  const reset = useCallback(() => {
    setForm(createDefaultForm());
    setBaseItinerary(null);
    setDisplayItinerary(null);
    setError(null);
    setSuccessMessage(null);
    setMutatingStop(null);
  }, []);

  return {
    form,
    updateField,
    togglePreference,
    submit,
    canSubmit,
    loading,
    error,
    itinerary: displayItinerary,
    baseItinerary,
    saveItinerary,
    saving,
    successMessage,
    removeStop,
    replaceStop,
    mutatingStop,
    reset,
  };
};

export default usePlanner;