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

const STORAGE_KEY = 'plangenie.currency';

export type SupportedCurrency = 'USD' | 'EUR' | 'MXN' | 'GBP' | 'CAD' | 'JPY';

type CurrencyContextValue = {
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
  converting: boolean;
  convertFromUsd: (amount: number) => number;
  formatAmount: (amountUsd: number, opts?: { minimumFractionDigits?: number }) => string;
  getRate: (currency?: SupportedCurrency) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const rates: Record<SupportedCurrency, { rate: number; symbol: string; label: string }> =
  {
    USD: { rate: 1, symbol: '$', label: 'US Dollar' },
    EUR: { rate: 0.92, symbol: '\u20ac', label: 'Euro' },
    MXN: { rate: 17.2, symbol: '$', label: 'Mexican Peso' },
    GBP: { rate: 0.78, symbol: '\u00a3', label: 'British Pound' },
    CAD: { rate: 1.36, symbol: '$', label: 'Canadian Dollar' },
    JPY: { rate: 141, symbol: '\u00a5', label: 'Japanese Yen' },
  };

export const currencyOptions = Object.entries(rates).map(([value, meta]) => ({
  value: value as SupportedCurrency,
  label: `${meta.label} (${value})`,
}));

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<SupportedCurrency>('USD');
  const [converting, setConverting] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && rates[stored as SupportedCurrency]) {
          setCurrencyState(stored as SupportedCurrency);
        }
      } catch (error) {
        console.warn('Failed to load currency preference', error);
      } finally {
        setConverting(false);
      }
    };

    void load();
  }, []);

  const persistCurrency = useCallback(async (next: SupportedCurrency) => {
    setCurrencyState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      console.warn('Failed to persist currency selection', error);
    }
  }, []);

  const convertFromUsd = useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount)) return 0;
      const meta = rates[currency];
      return amount * meta.rate;
    },
    [currency],
  );

  const formatAmount = useCallback(
    (amountUsd: number, opts?: { minimumFractionDigits?: number }) => {
      const value = convertFromUsd(amountUsd);
      const { symbol } = rates[currency];
      const fractionDigits = opts?.minimumFractionDigits ?? (currency === 'JPY' ? 0 : 2);
      return `${symbol}${value.toFixed(fractionDigits)}`;
    },
    [convertFromUsd, currency],
  );

  const getRate = useCallback(
    (target?: SupportedCurrency) => {
      const code = target ?? currency;
      return rates[code].rate;
    },
    [currency],
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency: persistCurrency,
      converting,
      convertFromUsd,
      formatAmount,
      getRate,
    }),
    [currency, persistCurrency, converting, convertFromUsd, formatAmount, getRate],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
