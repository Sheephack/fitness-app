import { daysBetween } from './localDate';
import type { WeightEntry } from './types';

export interface WeightSummary {
  latest: WeightEntry | null;
  latestChangeKg: number | null;
  movingAverage7dKg: number | null;
  linearTrend30dKgPerWeek: number | null;
  trendSampleCount: number;
  trendSpanDays: number;
  goalProgress: number | null;
}

function latestPerDay(entries: WeightEntry[]): WeightEntry[] {
  const sorted = [...entries].sort((a, b) => b.measuredAtUtc.localeCompare(a.measuredAtUtc));
  const byDay = new Map<string, WeightEntry>();
  for (const entry of sorted) {
    if (!byDay.has(entry.localDate)) byDay.set(entry.localDate, entry);
  }
  return [...byDay.values()].sort((a, b) => a.localDate.localeCompare(b.localDate));
}

export function calculateWeightSummary(
  entries: WeightEntry[],
  targetWeightKg: number | null,
): WeightSummary {
  const daily = latestPerDay(entries);
  const latest = daily.at(-1) ?? null;
  const previous = daily.at(-2) ?? null;
  if (!latest) {
    return {
      latest: null,
      latestChangeKg: null,
      movingAverage7dKg: null,
      linearTrend30dKgPerWeek: null,
      trendSampleCount: 0,
      trendSpanDays: 0,
      goalProgress: null,
    };
  }

  const sevenDay = daily.filter((entry) => daysBetween(entry.localDate, latest.localDate) <= 6);
  const movingAverage = sevenDay.reduce((sum, entry) => sum + entry.weightKg, 0) / sevenDay.length;
  const thirtyDay = daily.filter((entry) => daysBetween(entry.localDate, latest.localDate) <= 29);
  const firstTrend = thirtyDay[0];
  const span = firstTrend ? daysBetween(firstTrend.localDate, latest.localDate) : 0;
  let trend: number | null = null;
  if (thirtyDay.length >= 7 && span >= 14 && firstTrend) {
    const xs = thirtyDay.map((entry) => daysBetween(firstTrend.localDate, entry.localDate));
    const ys = thirtyDay.map((entry) => entry.weightKg);
    const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
    const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
    const numerator = xs.reduce(
      (sum, x, index) => sum + (x - meanX) * ((ys[index] ?? 0) - meanY),
      0,
    );
    const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
    trend = denominator === 0 ? null : (numerator / denominator) * 7;
  }

  const start = daily[0]?.weightKg ?? latest.weightKg;
  let goalProgress: number | null = null;
  if (targetWeightKg !== null && start !== targetWeightKg) {
    goalProgress = Math.max(0, Math.min(1, (start - latest.weightKg) / (start - targetWeightKg)));
  }

  return {
    latest,
    latestChangeKg: previous ? latest.weightKg - previous.weightKg : null,
    movingAverage7dKg: movingAverage,
    linearTrend30dKgPerWeek: trend,
    trendSampleCount: thirtyDay.length,
    trendSpanDays: span,
    goalProgress,
  };
}
