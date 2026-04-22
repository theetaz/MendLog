import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  type ColorScheme,
  THEMES,
  type ThemeColors,
} from '../../design/palette';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  mode: ThemeMode;
  scheme: ColorScheme;
  colors: ThemeColors;
  setMode(next: ThemeMode): void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = '@mendlog/theme-mode-v1';

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Testing hook — override the mode the provider starts with. */
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setModeState(raw);
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const scheme: ColorScheme = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
    return mode;
  }, [mode, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, colors: THEMES[scheme], setMode }),
    [mode, scheme, setMode],
  );

  // Don't flash light theme on cold start — wait for hydration before rendering.
  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Outside a provider (e.g. jest renderHook) — fall back to light.
    return {
      mode: 'light',
      scheme: 'light',
      colors: THEMES.light,
      setMode: () => {},
    };
  }
  return ctx;
}

/**
 * Reactive colors hook. Components using this re-render when the theme
 * changes. Re-exported by `src/design/tokens.ts` for convenience.
 */
export function useColors(): ThemeColors {
  return useTheme().colors;
}
