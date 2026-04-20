import { colors } from '../design/tokens';

export function heatColor(count: number): string {
  if (count <= 0) return colors.heat0;
  if (count <= 1) return colors.heat1;
  if (count <= 3) return colors.heat2;
  if (count <= 6) return colors.heat3;
  return colors.heat4;
}
