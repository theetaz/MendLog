import { useTheme } from '../features/theme/ThemeProvider';

export interface ThemeColors {
  // Backgrounds / surfaces
  bg: string;
  surface: string;
  line: string;
  lineSoft: string;
  // Text
  text: string;
  textDim: string;
  mute: string;
  muteDeep: string;
  // Brand
  ink: string;
  navy: string;
  navyDeep: string;
  navySoft: string;
  yellow: string;
  yellowDeep: string;
  // Status
  emerald: string;
  emeraldSoft: string;
  amber: string;
  amberSoft: string;
  red: string;
  redSoft: string;
  // Heatmap ramp
  heat0: string;
  heat1: string;
  heat2: string;
  heat3: string;
  heat4: string;
}

const lightColors: ThemeColors = {
  bg: '#F7F6F2',
  surface: '#FFFFFF',
  line: '#E6E3DA',
  lineSoft: '#EEEBE2',
  text: '#141414',
  textDim: '#4E4A42',
  mute: '#8E8A7D',
  muteDeep: '#5F5C54',
  ink: '#0E0E0E',
  navy: '#1E3A5F',
  navyDeep: '#15293F',
  navySoft: '#2B4C74',
  yellow: '#F5B800',
  yellowDeep: '#D99E00',
  emerald: '#1F9D55',
  emeraldSoft: '#D6F0DF',
  amber: '#D97706',
  amberSoft: '#FDEBCC',
  red: '#C53030',
  redSoft: '#F8D7D7',
  heat0: '#ECE9DF',
  heat1: '#C8E9D4',
  heat2: '#8FD1AC',
  heat3: '#4EB07C',
  heat4: '#1F7A46',
};

const darkColors: ThemeColors = {
  bg: '#0E0E0E',
  surface: '#161616',
  line: '#242424',
  lineSoft: '#1C1C1C',
  text: '#F3F2EE',
  textDim: '#CFCDC5',
  mute: '#8A8679',
  muteDeep: '#B5B1A6',
  ink: '#0E0E0E',
  navy: '#5789C2',
  navyDeep: '#3B6FAA',
  navySoft: '#6FA3DD',
  yellow: '#F5B800',
  yellowDeep: '#D99E00',
  emerald: '#2FC070',
  emeraldSoft: '#143E27',
  amber: '#F59E0B',
  amberSoft: '#3B2A0E',
  red: '#EF4444',
  redSoft: '#3A1818',
  heat0: '#1F1F1F',
  heat1: '#0E4429',
  heat2: '#006D32',
  heat3: '#26A641',
  heat4: '#39D353',
};

export const THEMES = { light: lightColors, dark: darkColors } as const;

export type ColorScheme = 'light' | 'dark';

/**
 * Reactive hook — components using this re-render when the theme changes.
 * Anywhere you used `import { colors }` before, switch to:
 *   const colors = useColors();
 */
export function useColors(): ThemeColors {
  return useTheme().colors;
}

/**
 * Back-compat: `colors` still imports and gives you the light palette.
 * Used by modules that can't call hooks (utilities / tests / heat.ts). Any
 * component rendering should use `useColors()` to react to theme changes.
 */
export const colors = lightColors;

export const fonts = {
  sans: 'IBMPlexSans',
  sansMedium: 'IBMPlexSans-Medium',
  sansSemiBold: 'IBMPlexSans-SemiBold',
  sansBold: 'IBMPlexSans-Bold',
  mono: 'JetBrainsMono',
  sinhala: 'NotoSansSinhala',
} as const;

export const radii = {
  sm: 9,
  md: 11,
  lg: 12,
  xl: 14,
  sheet: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;
