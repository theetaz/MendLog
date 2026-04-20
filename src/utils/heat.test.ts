import { heatColor } from './heat';
import { colors } from '../design/tokens';

describe('heatColor', () => {
  it('returns heat0 for 0 jobs', () => {
    expect(heatColor(0)).toBe(colors.heat0);
  });

  it('returns heat1 for 1 job', () => {
    expect(heatColor(1)).toBe(colors.heat1);
  });

  it('returns heat2 for 2–3 jobs', () => {
    expect(heatColor(2)).toBe(colors.heat2);
    expect(heatColor(3)).toBe(colors.heat2);
  });

  it('returns heat3 for 4–6 jobs', () => {
    expect(heatColor(4)).toBe(colors.heat3);
    expect(heatColor(6)).toBe(colors.heat3);
  });

  it('returns heat4 for 7 or more jobs', () => {
    expect(heatColor(7)).toBe(colors.heat4);
    expect(heatColor(12)).toBe(colors.heat4);
  });

  it('treats negative counts as zero', () => {
    expect(heatColor(-3)).toBe(colors.heat0);
  });
});
