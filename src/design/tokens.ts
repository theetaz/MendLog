// Public design-token entrypoint. Combines the data/types from `./palette`
// with the reactive `useColors` hook from the theme provider so consumers
// only need to import from one place. The cycle is avoided because
// `ThemeProvider` imports from `./palette` (leaf), not from this file.

export {
  colors,
  fonts,
  radii,
  spacing,
  THEMES,
  type ColorScheme,
  type ThemeColors,
} from './palette';

export { useColors } from '../features/theme/ThemeProvider';
