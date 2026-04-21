import { colors as lightColors, type ThemeColors } from '../design/tokens';

/**
 * Map a job-count to a heat color using the given theme palette.
 * If no palette is supplied, falls back to the light palette (back-compat
 * for tests and places that haven't been theme-migrated yet).
 */
export function heatColor(count: number, palette: ThemeColors = lightColors): string {
  if (count <= 0) return palette.heat0;
  if (count <= 1) return palette.heat1;
  if (count <= 3) return palette.heat2;
  if (count <= 6) return palette.heat3;
  return palette.heat4;
}
