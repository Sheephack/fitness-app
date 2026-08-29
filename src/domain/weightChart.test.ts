import { buildWeightChartPoints, filterWeightChartEntries } from './weightChart';
import { parseLocalDate } from './localDate';

test('maps one weight entry into the chart center without dividing by zero', () => {
  const [point] = buildWeightChartPoints(
    [
      {
        id: 'a',
        weightKg: 70,
        localDate: parseLocalDate('2026-08-01'),
        measuredAtUtc: '2026-08-01T08:00:00Z',
        note: null,
      },
    ],
    300,
    120,
  );
  expect(point).toMatchObject({ x: 150, value: 70, label: '2026-08-01' });
});

test('keeps date gaps proportional and filters the selected range', () => {
  const entries = [
    {
      id: 'a',
      weightKg: 70,
      localDate: parseLocalDate('2026-08-01'),
      measuredAtUtc: '2026-08-01T08:00:00Z',
      note: null,
    },
    {
      id: 'b',
      weightKg: 69.8,
      localDate: parseLocalDate('2026-08-02'),
      measuredAtUtc: '2026-08-02T08:00:00Z',
      note: null,
    },
    {
      id: 'c',
      weightKg: 69.5,
      localDate: parseLocalDate('2026-08-20'),
      measuredAtUtc: '2026-08-20T08:00:00Z',
      note: null,
    },
  ];
  const points = buildWeightChartPoints(entries, 300, 120);
  expect(points[1]!.x - points[0]!.x).toBeLessThan(points[2]!.x - points[1]!.x);
  expect(filterWeightChartEntries(entries, '7d')).toEqual([entries[2]]);
});
