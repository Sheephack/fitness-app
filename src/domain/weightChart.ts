import { daysBetween } from './localDate';
import type { WeightEntry } from './types';

export type WeightChartRange = '7d' | '30d' | '90d' | 'all';

export interface ChartPoint {
  id: string;
  x: number;
  y: number;
  value: number;
  label: string;
}

function latestPerDay(entries: WeightEntry[]): WeightEntry[] {
  const newestFirst = [...entries].sort((a, b) => b.measuredAtUtc.localeCompare(a.measuredAtUtc));
  const unique = new Map<string, WeightEntry>();
  for (const entry of newestFirst) {
    if (!unique.has(entry.localDate)) unique.set(entry.localDate, entry);
  }
  return [...unique.values()].sort((a, b) => a.localDate.localeCompare(b.localDate));
}

export function filterWeightChartEntries(
  entries: WeightEntry[],
  range: WeightChartRange,
): WeightEntry[] {
  const daily = latestPerDay(entries);
  const latest = daily.at(-1);
  if (!latest || range === 'all') return daily;
  const days = range === '7d' ? 6 : range === '30d' ? 29 : 89;
  return daily.filter((entry) => daysBetween(entry.localDate, latest.localDate) <= days);
}

export function buildWeightChartPoints(
  entries: WeightEntry[],
  width: number,
  height: number,
  padding = 20,
): ChartPoint[] {
  const values = [...entries].sort((a, b) => a.measuredAtUtc.localeCompare(b.measuredAtUtc));
  if (values.length === 0 || width <= 0 || height <= 0) return [];
  const min = Math.min(...values.map((entry) => entry.weightKg));
  const max = Math.max(...values.map((entry) => entry.weightKg));
  const range = max - min || 1;
  const usableWidth = Math.max(1, width - padding * 2);
  const usableHeight = Math.max(1, height - padding * 2);
  const first = values[0] as WeightEntry;
  const last = values.at(-1) as WeightEntry;
  const dateSpan = Math.max(1, daysBetween(first.localDate, last.localDate));
  return values.map((entry) => ({
    id: entry.id,
    x:
      padding +
      (values.length === 1
        ? usableWidth / 2
        : (daysBetween(first.localDate, entry.localDate) / dateSpan) * usableWidth),
    y: padding + (1 - (entry.weightKg - min) / range) * usableHeight,
    value: entry.weightKg,
    label: entry.localDate,
  }));
}
