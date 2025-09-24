import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealTimeKey = 'breakfast' | 'lunch' | 'dinner';

export type MealTimes = Record<MealTimeKey, string>;

type PlanningSettingsContextValue = {
  mealTimes: MealTimes;
  updateMealTime: (meal: MealTimeKey, value: string) => Promise<void>;
  resetMealTimes: () => Promise<void>;
};

const STORAGE_KEY = 'plangenie.meal-times';

const defaultMealTimes: MealTimes = {
  breakfast: '08:00',
  lunch: '15:00',
  dinner: '20:00',
};

const PlanningSettingsContext = createContext<PlanningSettingsContextValue | undefined>(
  undefined,
);

const isValidTime = (value: string) => /^\d{2}:\d{2}$/.test(value);

export const normaliseMealTime = (value: string): string => {
  if (!isValidTime(value)) {
    return '08:00';
  }
  const [hour, minute] = value.split(':').map(Number);
  const safeHour = Math.min(Math.max(hour, 0), 23).toString().padStart(2, '0');
  const safeMinute = Math.min(Math.max(minute, 0), 59).toString().padStart(2, '0');
  return `${safeHour}:${safeMinute}`;
};

export const PlanningSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [mealTimes, setMealTimes] = useState<MealTimes>(defaultMealTimes);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<MealTimes> | null;
        if (!parsed) return;
        setMealTimes((prev) => ({
          breakfast: normaliseMealTime(parsed.breakfast ?? prev.breakfast),
          lunch: normaliseMealTime(parsed.lunch ?? prev.lunch),
          dinner: normaliseMealTime(parsed.dinner ?? prev.dinner),
        }));
      } catch (error) {
        console.warn('Failed to load meal times', error);
      }
    };

    void load();
  }, []);

  const persist = useCallback(async (next: MealTimes) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('Failed to save meal times', error);
    }
  }, []);

  const updateMealTime = useCallback(
    async (meal: MealTimeKey, value: string) => {
      setMealTimes((prev) => {
        const next = { ...prev, [meal]: normaliseMealTime(value) };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const resetMealTimes = useCallback(async () => {
    setMealTimes(defaultMealTimes);
    await persist(defaultMealTimes);
  }, [persist]);

  const value = useMemo(
    () => ({
      mealTimes,
      updateMealTime,
      resetMealTimes,
    }),
    [mealTimes, updateMealTime, resetMealTimes],
  );

  return (
    <PlanningSettingsContext.Provider value={value}>
      {children}
    </PlanningSettingsContext.Provider>
  );
};

export const usePlanningSettings = () => {
  const context = useContext(PlanningSettingsContext);
  if (!context) {
    throw new Error('usePlanningSettings must be used within PlanningSettingsProvider');
  }
  return context;
};

export const getDefaultMealTimes = () => defaultMealTimes;

