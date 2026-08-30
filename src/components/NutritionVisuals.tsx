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
  size = 138,
}: {
  value: number;
  target: number;
  label: string;
  size?: number;
}) {
  const theme = useAppTheme();
  const radius = (size - 26) / 2;
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
          stroke={theme.accentStrong}
          strokeOpacity={0.26}
          strokeWidth={12}
          fill="none"
        />
        {ratio > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.accentStrong}
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${length} ${length}`}
            strokeDashoffset={length * (1 - ratio)}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
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
  color,
}: {
  label: string;
  value: number;
  known: boolean;
  min: number;
  max: number;
  color?: string;
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
            { left: zoneLeft, width: zoneWidth, backgroundColor: color ?? theme.accentSoft },
          ]}
        />
        {known ? (
          <>
            <View
              style={[
                styles.rangeMarker,
                {
                  left: markerLeft,
                  backgroundColor:
                    state === 'above' ? theme.warning : (color ?? theme.accentStrong),
                },
              ]}
            />
            <View
              style={[
                styles.rangeMarkerDot,
                {
                  left: markerLeft,
                  backgroundColor:
                    state === 'above' ? theme.warning : (color ?? theme.accentStrong),
                  borderColor: theme.background,
                },
              ]}
            />
          </>
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
  const radius = 26;
  const length = 2 * Math.PI * radius;
  const progress = props.known ? Math.max(0, Math.min(1, props.value / props.max)) : 0;
  const color = props.color ?? theme.accentStrong;
  return (
    <View
      style={styles.miniRing}
      accessibilityLabel={`${props.label}: ${props.known ? `${Math.round(props.value)} g` : t('home.unknown')}`}
    >
      <Svg width={86} height={86}>
        <Circle
          cx={43}
          cy={43}
          r={radius}
          stroke={theme.surfaceMuted}
          strokeWidth={7}
          fill="none"
        />
        <Circle
          cx={43}
          cy={43}
          r={radius}
          stroke={color}
          strokeOpacity={0.26}
          strokeWidth={7}
          fill="none"
        />
        {progress > 0 ? (
          <Circle
            cx={43}
            cy={43}
            r={radius}
            stroke={color}
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${length} ${length}`}
            strokeDashoffset={length * (1 - progress)}
            rotation="-90"
            origin="43, 43"
          />
        ) : null}
      </Svg>
      <AppText variant="caption" style={styles.ringMacroLabel}>
        {props.label}
      </AppText>
      <AppText variant="caption" muted>
        {props.known ? `${Math.round(props.value)} g` : '—'}
      </AppText>
      <AppText variant="caption" style={{ color: theme.textSubtle }}>
        {props.min}–{props.max} g
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
  rangeTrack: { height: 12, borderRadius: 99, position: 'relative', overflow: 'hidden' },
  targetZone: { position: 'absolute', top: 0, bottom: 0, borderRadius: 99 },
  rangeMarker: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 12,
    borderRadius: 99,
    marginLeft: -2,
  },
  rangeMarkerDot: {
    position: 'absolute',
    top: 2,
    width: 8,
    height: 8,
    borderWidth: 2,
    borderRadius: 99,
    marginLeft: -4,
  },
  miniRing: { width: '100%', alignItems: 'center', gap: 1 },
  ringMacroLabel: { fontWeight: '700', textAlign: 'center' },
});
