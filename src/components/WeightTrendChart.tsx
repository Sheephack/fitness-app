import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { buildWeightChartPoints } from '@/domain/weightChart';
import type { WeightEntry } from '@/domain/types';
import { useAppTheme } from '@/theme/theme';

const HEIGHT = 164;
const HIT_SIZE = 44;

export function WeightTrendChart({
  entries,
  format,
}: {
  entries: WeightEntry[];
  format: (kg: number) => string;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [width, setWidth] = useState(0);
  const points = useMemo(() => buildWeightChartPoints(entries, width, HEIGHT), [entries, width]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = points.find((point) => point.id === selectedId) ?? points.at(-1) ?? null;

  useEffect(() => {
    setSelectedId(points.at(-1)?.id ?? null);
  }, [points]);

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
          <Svg width={width} height={HEIGHT}>
            {[44, 82, 120].map((y) => (
              <Line
                key={y}
                x1="20"
                x2={width - 20}
                y1={y}
                y2={y}
                stroke={theme.border}
                strokeWidth="1"
              />
            ))}
            {points.length > 1 ? (
              <Polyline
                points={points.map((point) => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke={theme.accent}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {points.map((point) => (
              <Circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                r={point.id === selected?.id ? 7 : 4}
                fill={point.id === selected?.id ? theme.accentStrong : theme.surface}
                stroke={theme.accent}
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
                  top: Math.max(0, Math.min(HEIGHT - HIT_SIZE, point.y - HIT_SIZE / 2)),
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
  frame: { height: HEIGHT, position: 'relative' },
  hit: { position: 'absolute', width: HIT_SIZE, height: HIT_SIZE, borderRadius: HIT_SIZE / 2 },
  tooltip: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 4 },
});
