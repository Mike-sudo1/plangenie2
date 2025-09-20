import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Activity = {
  id: string;
  timeOfDay: string;
  title: string;
  description: string;
  location?: string;
  costEstimate?: number;
  mapsLink?: string;
  weatherNote?: string;
  surprise?: boolean;
};

export type ItineraryDay = {
  date: string;
  summary: string;
  weather?: string;
  activities: Activity[];
};

export type Itinerary = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  surpriseMode: boolean;
  createdAt: string;
  estimatedTotalCost?: number;
  days: ItineraryDay[];
};

export type Settings = {
  units: 'metric' | 'imperial';
  defaultBudget: number;
  currency: string;
};

export type PlanRequest = {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  interests: string[];
};

type ItineraryContextValue = {
  plan: Itinerary | null;
  history: Itinerary[];
  isLoading: boolean;
  error: string | null;
  surpriseMode: boolean;
  settings: Settings;
  generateItinerary: (request: PlanRequest) => Promise<Itinerary | null>;
  restoreFromHistory: (id: string) => void;
  removeFromHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  setSurpriseMode: (value: boolean) => void;
  updateSettings: (update: Partial<Settings>) => void;
  clearError: () => void;
  resetPlan: () => void;
};

const ItineraryContext = createContext<ItineraryContextValue | undefined>(undefined);

const STORAGE_KEY = 'plangenie_history_v1';

const extras = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as Record<string, string | undefined>;
const OPENAI_API_KEY = extras.OPENAI_API_KEY;
const OPENWEATHER_API_KEY = extras.OPENWEATHER_API_KEY;

const DEFAULT_SETTINGS: Settings = {
  units: 'metric',
  defaultBudget: 1500,
  currency: 'USD',
};

const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const addDays = (input: string, offset: number) => {
  const base = new Date(input);
  if (Number.isNaN(base.getTime())) {
    return input;
  }

  base.setDate(base.getDate() + offset);
  return base.toISOString().slice(0, 10);
};

type OpenAIResponse = {
  days?: Array<{
    date?: string;
    summary?: string;
    weather?: string;
    activities?: Array<{
      timeOfDay?: string;
      title?: string;
      description?: string;
      location?: string;
      costEstimate?: number;
      mapsQuery?: string;
      weatherNote?: string;
      surprise?: boolean;
    }>;
  }>;
  estimatedTotalCost?: number;
  currency?: string;
};

type WeatherForecast = {
  list?: Array<{
    dt_txt?: string;
    main?: { temp_min?: number; temp_max?: number };
    weather?: Array<{ description?: string }>;
  }>;
};

const buildMapsLink = (query?: string) => {
  if (!query) {
    return undefined;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const useWeatherSummary = (units: 'metric' | 'imperial') => {
  return useCallback(
    (forecast: WeatherForecast | null, startDate: string, length: number) => {
      if (!forecast?.list?.length) {
        return {} as Record<string, string>;
      }

      const result: Record<string, string> = {};
      const grouped: Record<string, { min: number; max: number; descriptions: string[] }> = {};

      forecast.list.forEach((entry) => {
        if (!entry?.dt_txt) {
          return;
        }
        const [date] = entry.dt_txt.split(' ');
        if (!grouped[date]) {
          grouped[date] = {
            min: Number.POSITIVE_INFINITY,
            max: Number.NEGATIVE_INFINITY,
            descriptions: [],
          };
        }

        const values = grouped[date];
        const min = entry.main?.temp_min;
        const max = entry.main?.temp_max;
        if (typeof min === 'number') {
          values.min = Math.min(values.min, min);
        }
        if (typeof max === 'number') {
          values.max = Math.max(values.max, max);
        }
        const description = entry.weather?.[0]?.description;
        if (description) {
          values.descriptions.push(description);
        }
      });

      for (let index = 0; index < length; index += 1) {
        const date = addDays(startDate, index);
        const entry = grouped[date];
        if (!entry) {
          continue;
        }

        const descriptor = entry.descriptions[0] ?? 'Forecast unavailable';
        const unitSymbol = units === 'metric' ? '°C' : '°F';
        const min = Number.isFinite(entry.min) ? Math.round(entry.min) : null;
        const max = Number.isFinite(entry.max) ? Math.round(entry.max) : null;
        if (min !== null && max !== null) {
          result[date] = `${descriptor}, ${min}${unitSymbol} / ${max}${unitSymbol}`;
        } else {
          result[date] = descriptor;
        }
      }

      return result;
    },
    [units],
  );
};

const fetchWeatherForDestination = async (
  destination: string,
  units: 'metric' | 'imperial',
): Promise<WeatherForecast | null> => {
  if (!OPENWEATHER_API_KEY) {
    return null;
  }

  try {
    const geoRes = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
      params: {
        q: destination,
        limit: 1,
        appid: OPENWEATHER_API_KEY,
      },
    });

    const coordinates = geoRes.data?.[0];
    if (!coordinates?.lat || !coordinates?.lon) {
      return null;
    }

    const forecastRes = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        units,
        appid: OPENWEATHER_API_KEY,
      },
    });

    return forecastRes.data;
  } catch (error) {
    console.warn('[PlanGenie] Failed to fetch weather forecast', error);
    return null;
  }
};

export const ItineraryProvider = ({ children }: PropsWithChildren) => {
  const [plan, setPlan] = useState<Itinerary | null>(null);
  const [history, setHistory] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surpriseMode, setSurpriseMode] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const buildWeatherSummary = useWeatherSummary(settings.units);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Itinerary[];
          setHistory(parsed);
        }
      } catch (storageError) {
        console.warn('[PlanGenie] Failed to load history', storageError);
      }
    };

    hydrate();
  }, []);

  const persistHistory = useCallback(async (entries: Itinerary[]) => {
    setHistory(entries);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (storageError) {
      console.warn('[PlanGenie] Failed to persist history', storageError);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const resetPlan = useCallback(() => setPlan(null), []);

  const updateSettings = useCallback((update: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...update }));
  }, []);

  const removeFromHistory = useCallback(
    async (id: string) => {
      const next = history.filter((entry) => entry.id !== id);
      await persistHistory(next);
    },
    [history, persistHistory],
  );

  const clearHistory = useCallback(async () => {
    await persistHistory([]);
  }, [persistHistory]);

  const restoreFromHistory = useCallback(
    (id: string) => {
      const entry = history.find((item) => item.id === id);
      if (entry) {
        setPlan(entry);
      }
    },
    [history],
  );

  const mapResponseToItinerary = useCallback(
    async (
      payload: OpenAIResponse,
      request: PlanRequest,
    ): Promise<Itinerary | null> => {
      if (!payload?.days?.length) {
        return null;
      }

      const normalizedDays: ItineraryDay[] = payload.days.map((day, index) => {
        const date = day?.date?.slice(0, 10) ?? addDays(request.startDate, index);
        const activities: Activity[] = (day?.activities ?? []).map((activity) => {
          const mapsQuery = activity.mapsQuery ?? activity.location;
          return {
            id: generateId(),
            timeOfDay: activity.timeOfDay ?? 'any',
            title: activity.title ?? 'Activity',
            description: activity.description ?? 'Enjoy your time!',
            location: activity.location,
            costEstimate: activity.costEstimate,
            weatherNote: activity.weatherNote,
            surprise: surpriseMode && activity.surprise === true,
            mapsLink: buildMapsLink(mapsQuery),
          };
        });

        return {
          date,
          summary: day?.summary ?? '',
          weather: day?.weather,
          activities,
        };
      });

      if (OPENWEATHER_API_KEY) {
        const weatherForecast = await fetchWeatherForDestination(request.destination, settings.units);
        const weatherSummaries = buildWeatherSummary(
          weatherForecast,
          request.startDate,
          normalizedDays.length,
        );

        normalizedDays.forEach((entry) => {
          if (weatherSummaries[entry.date]) {
            entry.weather = weatherSummaries[entry.date];
          }
        });
      }

      const estimatedTotalCost = payload.estimatedTotalCost
        ?? normalizedDays.reduce((sum, day) => {
          return (
            sum
            + day.activities.reduce((inner, activity) => inner + (activity.costEstimate ?? 0), 0)
          );
        }, 0);

      return {
        id: generateId(),
        destination: request.destination,
        startDate: request.startDate,
        endDate: request.endDate,
        budget: request.budget,
        currency: payload.currency ?? settings.currency,
        surpriseMode,
        createdAt: new Date().toISOString(),
        estimatedTotalCost,
        days: normalizedDays,
      };
    },
    [buildWeatherSummary, settings.currency, settings.units, surpriseMode],
  );

  const generateItinerary = useCallback(
    async (request: PlanRequest): Promise<Itinerary | null> => {
      if (!OPENAI_API_KEY) {
        setError(
          'Missing OpenAI API key. Add your key to the .env file and restart the app to generate itineraries.',
        );
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const prompt =
          'You are PlanGenie, an upbeat travel assistant. Produce a rich JSON itinerary following this schema: {"days":[{"date":"YYYY-MM-DD","summary":"string","weather":"string","activities":[{"timeOfDay":"morning|afternoon|evening","title":"string","description":"string","location":"string","costEstimate":number,"mapsQuery":"string","weatherNote":"string","surprise":boolean}]}],"estimatedTotalCost":number,"currency":"USD"}. Ensure each day includes morning, afternoon, and evening plans, one surprise if surprise mode is enabled, and budget-conscious suggestions. Use accessible, factual tone.';

        const interestsLine = request.interests.length
          ? `I like ${request.interests.join(', ')}.`
          : 'I am open to a variety of activities.';

        const surpriseLine = surpriseMode
          ? 'Include one surprising or delightfully unexpected activity per day.'
          : 'Do not include any surprise activities.';

        const userContent = `Destination: ${request.destination}. Travel dates: ${request.startDate} to ${request.endDate}. Total budget: ${request.budget} ${settings.currency}. ${interestsLine} ${surpriseLine} Provide concise weather-aware notes, estimated costs, and short Google Maps search queries in the mapsQuery field.`;

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: prompt,
              },
              {
                role: 'user',
                content: userContent,
              },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('OpenAI returned an empty response.');
        }

        const cleanedContent = content.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');

        const parsed = JSON.parse(cleanedContent) as OpenAIResponse;
        const itinerary = await mapResponseToItinerary(parsed, request);
        if (!itinerary) {
          throw new Error('Unable to understand the itinerary response.');
        }

        setPlan(itinerary);
        const updatedHistory = [itinerary, ...history].slice(0, 10);
        await persistHistory(updatedHistory);

        return itinerary;
      } catch (err: unknown) {
        console.error('[PlanGenie] Failed to generate itinerary', err);
        const message =
          axios.isAxiosError(err)
            ? err.response?.data?.error?.message ?? err.message
            : err instanceof Error
              ? err.message
              : 'Unexpected error while generating itinerary.';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [history, mapResponseToItinerary, persistHistory, settings.currency, surpriseMode],
  );

  const value = useMemo<ItineraryContextValue>(
    () => ({
      plan,
      history,
      isLoading,
      error,
      surpriseMode,
      settings,
      generateItinerary,
      restoreFromHistory,
      removeFromHistory,
      clearHistory,
      setSurpriseMode,
      updateSettings,
      clearError,
      resetPlan,
    }),
    [
      plan,
      history,
      isLoading,
      error,
      surpriseMode,
      settings,
      generateItinerary,
      restoreFromHistory,
      removeFromHistory,
      clearHistory,
      updateSettings,
      clearError,
      resetPlan,
    ],
  );

  return <ItineraryContext.Provider value={value}>{children}</ItineraryContext.Provider>;
};

export const useItinerary = () => {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error('useItinerary must be used within an ItineraryProvider');
  }

  return context;
};
