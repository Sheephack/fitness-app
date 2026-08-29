import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui';
import { useAppTheme } from '@/theme/theme';

export type RangeState = 'below' | 'within' | 'above' | 'unknown';

export function rangeState(value: number, known: boolean, min: number, max: number): RangeState {
  if (!known) return 'unknown';
  if (value < min) return 'below';
  if (value > max) return 'above';
  return 'within';
}

export function CalorieRing({
  value,
  target,
  label,
}: {
  value: number;
  target: number;
  label: string;
}) {
  const theme = useAppTheme();
  const size = 128;
  const radius = 51;
  const length = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, value / target));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: Math.round(target), now: Math.round(value) }}
      style={styles.calorieRing}
    >
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.surfaceMuted}
          strokeWidth={12}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.accent}
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
          strokeDashoffset={length * (1 - ratio)}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringLabel}>
        <AppText variant="title" style={styles.tabular}>
          {Math.round(value)}
        </AppText>
        <AppText variant="caption" muted>
          {label}
        </AppText>
      </View>
    </View>
  );
}

export function MacroRangeBar({
  label,
  value,
  known,
  min,
  max,
}: {
  label: string;
  value: number;
  known: boolean;
  min: number;
  max: number;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const state = rangeState(value, known, min, max);
  const scale = Math.max(max * 1.3, value * 1.1, 1);
  const zoneLeft = `${(min / scale) * 100}%` as `${number}%`;
  const zoneWidth = `${((max - min) / scale) * 100}%` as `${number}%`;
  const markerLeft = `${Math.min(100, (value / scale) * 100)}%` as `${number}%`;
  return (
    <View
      style={styles.macroRow}
      accessibilityLabel={`${label}: ${state === 'unknown' ? t('home.unknown') : `${Math.round(value)} g, ${t(`home.range${state}`)}`}`}
    >
      <View style={styles.macroTop}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" muted>
          {known ? `${Math.round(value)} g` : t('home.unknown')}
        </AppText>
      </View>
      <View style={[styles.rangeTrack, { backgroundColor: theme.surfaceMuted }]}>
        <View
          style={[
            styles.targetZone,
            { left: zoneLeft, width: zoneWidth, backgroundColor: theme.accentSoft },
          ]}
        />
        {known ? (
          <View
            style={[
              styles.rangeMarker,
              {
                left: markerLeft,
                backgroundColor: state === 'above' ? theme.warning : theme.accentStrong,
              },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.macroTop}>
        <AppText variant="caption" muted>
          {min} g
        </AppText>
        <AppText
          variant="caption"
          style={{ color: state === 'within' ? theme.accentStrong : theme.textMuted }}
        >
          {t(`home.range${state}`)}
        </AppText>
        <AppText variant="caption" muted>
          {max} g
        </AppText>
      </View>
    </View>
  );
}

export function MacroRangeRing(props: Parameters<typeof MacroRangeBar>[0]) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const state = rangeState(props.value, props.known, props.min, props.max);
  const radius = 26;
  const length = 2 * Math.PI * radius;
  const scale = Math.max(props.max * 1.3, props.value * 1.1, 1);
  const start = props.min / scale;
  const span = (props.max - props.min) / scale;
  const indicator = Math.min(0.995, props.value / scale);
  return (
    <View
      style={styles.miniRing}
      accessibilityLabel={`${props.label}: ${props.known ? `${Math.round(props.value)} g` : t('home.unknown')}`}
    >
      <Svg width={72} height={72}>
        <Circle
          cx={36}
          cy={36}
          r={radius}
          stroke={theme.surfaceMuted}
          strokeWidth={7}
          fill="none"
        />
        <Circle
          cx={36}
          cy={36}
          r={radius}
          stroke={theme.accentSoft}
          strokeWidth={7}
          fill="none"
          strokeDasharray={`${length * span} ${length}`}
          strokeDashoffset={-length * (1 - start)}
          rotation="-90"
          origin="36, 36"
        />
        {props.known ? (
          <Circle
            cx={36 + Math.cos(indicator * Math.PI * 2 - Math.PI / 2) * radius}
            cy={36 + Math.sin(indicator * Math.PI * 2 - Math.PI / 2) * radius}
            r={4.5}
            fill={state === 'above' ? theme.warning : theme.accentStrong}
          />
        ) : null}
      </Svg>
      <AppText variant="caption" style={styles.ringMacroLabel}>
        {props.label}
      </AppText>
      <AppText variant="caption" muted>
        {props.known ? `${Math.round(props.value)} g` : '—'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  calorieRing: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  ringSvg: { position: 'absolute' },
  ringLabel: { alignItems: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
  macroRow: { gap: 6 },
  macroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rangeTrack: { height: 10, borderRadius: 99, position: 'relative', overflow: 'hidden' },
  targetZone: { position: 'absolute', top: 0, bottom: 0, borderRadius: 99 },
  rangeMarker: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 14,
    borderRadius: 99,
    marginLeft: -2,
  },
  miniRing: { width: 74, alignItems: 'center', gap: 1 },
  ringMacroLabel: { fontWeight: '700', textAlign: 'center' },
});
