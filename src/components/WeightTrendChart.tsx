import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Polygon, Polyline, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { buildWeightChartPoints } from '@/domain/weightChart';
import type { WeightEntry } from '@/domain/types';
import { useAppTheme } from '@/theme/theme';

const HIT_SIZE = 44;

export function WeightTrendChart({
  entries,
  format,
  height = 232,
  targetKg,
  onSelectionChange,
}: {
  entries: WeightEntry[];
  format: (kg: number) => string;
  height?: number;
  targetKg?: number | null;
  onSelectionChange?: (entry: WeightEntry | null) => void;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [width, setWidth] = useState(0);
  const points = useMemo(
    () => buildWeightChartPoints(entries, width, height),
    [entries, height, width],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = points.find((point) => point.id === selectedId) ?? points.at(-1) ?? null;
  const values = entries.map((entry) => entry.weightKg);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const targetIsInRange =
    targetKg !== null && targetKg !== undefined && targetKg >= minimum && targetKg <= maximum;
  const targetY =
    targetIsInRange && maximum !== minimum
      ? 20 + (1 - ((targetKg as number) - minimum) / (maximum - minimum)) * Math.max(1, height - 40)
      : null;

  useEffect(() => {
    setSelectedId(points.at(-1)?.id ?? null);
  }, [points]);

  useEffect(() => {
    onSelectionChange?.(entries.find((entry) => entry.id === selected?.id) ?? null);
  }, [entries, onSelectionChange, selected?.id]);

  const onLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth !== width) setWidth(nextWidth);
  };

  if (entries.length === 0) {
    return <Text style={[styles.empty, { color: theme.textMuted }]}>{t('common.noData')}</Text>;
  }

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={t('weight.chartLabel')}
      onLayout={onLayout}
    >
      {width > 0 ? (
        <View style={styles.frame}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={theme.accent} stopOpacity="0.38" />
                <Stop offset="1" stopColor={theme.accent} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            {[0.24, 0.5, 0.76].map((ratio) => (
              <Line
                key={ratio}
                x1="20"
                x2={width - 20}
                y1={Math.round(height * ratio)}
                y2={Math.round(height * ratio)}
                stroke={theme.border}
                strokeWidth="1"
              />
            ))}
            {points.length > 1 ? (
              <>
                <Polygon
                  points={`${points[0]?.x},${height - 20} ${points.map((point) => `${point.x},${point.y}`).join(' ')} ${points.at(-1)?.x},${height - 20}`}
                  fill="url(#weightAreaGradient)"
                />
                <Polyline
                  points={points.map((point) => `${point.x},${point.y}`).join(' ')}
                  fill="none"
                  stroke={theme.accentStrong}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : null}
            {targetY !== null ? (
              <Line
                x1="20"
                x2={width - 20}
                y1={targetY}
                y2={targetY}
                stroke={theme.cyan}
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
            ) : null}
            {points.map((point) => (
              <Circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                r={point.id === selected?.id ? 7 : 4}
                fill={point.id === selected?.id ? theme.accentStrong : theme.surface}
                stroke={theme.accentStrong}
                strokeWidth="2"
              />
            ))}
          </Svg>
          {points.map((point) => (
            <Pressable
              key={point.id}
              accessibilityRole="button"
              accessibilityLabel={`${point.label}, ${format(point.value)}`}
              onPress={() => setSelectedId(point.id)}
              style={({ pressed }) => [
                styles.hit,
                {
                  left: Math.max(0, Math.min(width - HIT_SIZE, point.x - HIT_SIZE / 2)),
                  top: Math.max(0, Math.min(height - HIT_SIZE, point.y - HIT_SIZE / 2)),
                  opacity: pressed ? 0.16 : 0,
                  backgroundColor: theme.accent,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
      {selected ? (
        <Text accessibilityLiveRegion="polite" style={[styles.tooltip, { color: theme.textMuted }]}>
          {selected.label} · {format(selected.value)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, lineHeight: 20 },
  frame: { position: 'relative' },
  hit: { position: 'absolute', width: HIT_SIZE, height: HIT_SIZE, borderRadius: HIT_SIZE / 2 },
  tooltip: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 4 },
});
