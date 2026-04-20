import { genActivity } from './activity';

describe('genActivity', () => {
  const REFERENCE = new Date('2026-03-15T00:00:00Z');

  it('returns weeks * 7 entries', () => {
    expect(genActivity(12, REFERENCE)).toHaveLength(84);
    expect(genActivity(52, REFERENCE)).toHaveLength(364);
  });

  it('each entry has date and non-negative integer count', () => {
    const out = genActivity(4, REFERENCE);
    for (const entry of out) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isInteger(entry.count)).toBe(true);
      expect(entry.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('is ordered oldest first, newest last', () => {
    const out = genActivity(4, REFERENCE);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].date > out[i - 1].date).toBe(true);
    }
  });

  it('last entry date equals the reference date', () => {
    const out = genActivity(4, REFERENCE);
    expect(out[out.length - 1].date).toBe('2026-03-15');
  });

  it('is deterministic for the same reference date', () => {
    const a = genActivity(8, REFERENCE);
    const b = genActivity(8, REFERENCE);
    expect(a).toEqual(b);
  });
});
