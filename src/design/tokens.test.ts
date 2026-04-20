import { colors, fonts, radii, spacing } from './tokens';

describe('design tokens', () => {
  it('exposes the brand palette', () => {
    expect(colors.navy).toBe('#1E3A5F');
    expect(colors.yellow).toBe('#F5B800');
    expect(colors.bg).toBe('#F7F6F2');
  });

  it('exposes a 5-step heat ramp', () => {
    expect(colors.heat0).toBeDefined();
    expect(colors.heat1).toBeDefined();
    expect(colors.heat2).toBeDefined();
    expect(colors.heat3).toBeDefined();
    expect(colors.heat4).toBeDefined();
  });

  it('exposes font family names', () => {
    expect(fonts.sans).toBe('IBMPlexSans');
    expect(fonts.mono).toBe('JetBrainsMono');
    expect(fonts.sinhala).toBe('NotoSansSinhala');
  });

  it('exposes radii and spacing scales', () => {
    expect(radii.md).toBeGreaterThan(radii.sm);
    expect(radii.lg).toBeGreaterThan(radii.md);
    expect(radii.pill).toBe(999);
    expect(spacing.md).toBeGreaterThan(spacing.sm);
  });
});
