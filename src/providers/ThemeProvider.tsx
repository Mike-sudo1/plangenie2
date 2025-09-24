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
import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
  MD3Theme,
} from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme as NavigationTheme,
} from '@react-navigation/native';

const THEME_STORAGE_KEY = 'plangenie.theme-mode';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  isReady: boolean;
  paperTheme: MD3Theme;
  navigationTheme: NavigationTheme;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const palette = {
  primary: '#2563eb',
  secondary: '#f97316',
};

const createLightTheme = (): MD3Theme => ({
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    secondary: palette.secondary,
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#e2e8f0',
  },
});

const createDarkTheme = (): MD3Theme => ({
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.primary,
    secondary: palette.secondary,
    background: '#0f172a',
    surface: '#111827',
    surfaceVariant: '#1f2937',
  },
});

const { LightTheme: PaperNavigationLightTheme, DarkTheme: PaperNavigationDarkTheme } =
  adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setMode(stored);
        }
      } catch (error) {
        console.warn('Failed to read saved theme mode', error);
      } finally {
        setIsReady(true);
      }
    };

    void loadThemePreference();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((error) => {
      console.warn('Failed to persist theme mode', error);
    });
  }, [isReady, mode]);

  const paperTheme = useMemo(() => {
    const base = mode === 'light' ? createLightTheme() : createDarkTheme();
    return {
      ...base,
      colors: {
        ...base.colors,
        tertiary: '#14b8a6',
      },
    } as MD3Theme;
  }, [mode]);

  const navigationTheme = useMemo<NavigationTheme>(() => {
    if (mode === 'light') {
      return {
        ...PaperNavigationLightTheme,
        colors: {
          ...PaperNavigationLightTheme.colors,
          primary: paperTheme.colors.primary,
          background: paperTheme.colors.background,
          text: paperTheme.colors.onBackground,
          card: paperTheme.colors.surface,
        },
      };
    }

    return {
      ...PaperNavigationDarkTheme,
      colors: {
        ...PaperNavigationDarkTheme.colors,
        primary: paperTheme.colors.primary,
        background: paperTheme.colors.background,
        text: paperTheme.colors.onBackground,
        card: paperTheme.colors.surface,
      },
    };
  }, [
    mode,
    paperTheme.colors.background,
    paperTheme.colors.onBackground,
    paperTheme.colors.primary,
    paperTheme.colors.surface,
  ]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isReady,
      paperTheme,
      navigationTheme,
      toggleTheme,
      setMode,
    }),
    [mode, isReady, paperTheme, navigationTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
};
