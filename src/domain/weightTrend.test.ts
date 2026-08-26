import { calculateWeightSummary } from './weightTrend';
import { addLocalDays, parseLocalDate } from './localDate';
import type { WeightEntry } from './types';

describe('weight trends', () => {
  test('keeps moving average and linear trend as separate metrics', () => {
    const start = parseLocalDate('2026-08-01');
    const entries: WeightEntry[] = Array.from({ length: 8 }, (_, index) => ({
      id: String(index),
      weightKg: 90 - index * 0.25,
      localDate: addLocalDays(start, index * 2),
      measuredAtUtc: `${addLocalDays(start, index * 2)}T12:00:00.000Z`,
      note: null,
    }));
    const summary = calculateWeightSummary(entries, 80);
    expect(summary.movingAverage7dKg).not.toBeNull();
    expect(summary.linearTrend30dKgPerWeek).toBeCloseTo(-0.875, 2);
    expect(summary.trendSampleCount).toBe(8);
    expect(summary.trendSpanDays).toBe(14);
  });

  test('refuses to invent a 30-day trend with insufficient span', () => {
    const date = parseLocalDate('2026-08-01');
    const entries: WeightEntry[] = Array.from({ length: 7 }, (_, index) => ({
      id: String(index),
      weightKg: 90 - index * 0.1,
      localDate: addLocalDays(date, index),
      measuredAtUtc: `${addLocalDays(date, index)}T12:00:00.000Z`,
      note: null,
    }));
    expect(calculateWeightSummary(entries, 80).linearTrend30dKgPerWeek).toBeNull();
  });
});
