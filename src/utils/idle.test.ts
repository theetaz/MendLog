import { formatIdle, parseIdle } from './idle';

describe('formatIdle', () => {
  it('formats whole hours and minutes', () => {
    expect(formatIdle(260)).toBe('4h 20m');
  });

  it('zero-pads hours at zero', () => {
    expect(formatIdle(45)).toBe('0h 45m');
  });

  it('formats exactly one hour', () => {
    expect(formatIdle(60)).toBe('1h 0m');
  });

  it('clamps negative to 0h 0m', () => {
    expect(formatIdle(-5)).toBe('0h 0m');
  });
});

describe('parseIdle', () => {
  it('parses "4h 20m"', () => {
    expect(parseIdle('4h 20m')).toBe(260);
  });

  it('parses "0h 45m"', () => {
    expect(parseIdle('0h 45m')).toBe(45);
  });

  it('tolerates extra whitespace', () => {
    expect(parseIdle('  2h   5m  ')).toBe(125);
  });

  it('returns 0 for unparseable input', () => {
    expect(parseIdle('garbage')).toBe(0);
  });
});
