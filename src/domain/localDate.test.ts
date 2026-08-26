import { addLocalDays, daysBetween, parseLocalDate } from './localDate';

describe('LocalDate', () => {
  test('uses calendar arithmetic across month boundaries', () => {
    expect(addLocalDays(parseLocalDate('2026-03-01'), -1)).toBe('2026-02-28');
    expect(addLocalDays(parseLocalDate('2024-03-01'), -1)).toBe('2024-02-29');
  });

  test('keeps day math independent from time zones and DST', () => {
    expect(daysBetween(parseLocalDate('2026-03-07'), parseLocalDate('2026-03-15'))).toBe(8);
  });

  test('rejects malformed and impossible dates', () => {
    expect(() => parseLocalDate('25/08/2026')).toThrow();
    expect(() => parseLocalDate('2026-02-30')).toThrow();
  });
});
