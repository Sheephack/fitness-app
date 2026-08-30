import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Button, ChoiceRow, Field, InlineNotice, Screen } from '@/components/ui';
import { parseDecimalInput } from '@/domain/numericInput';
import { displayToKg, kgToDisplay, roundTo } from '@/domain/units';
import { calculateWeightSummary, type WeightSummary } from '@/domain/weightTrend';
import { WeightTrendChart } from '@/components/WeightTrendChart';
import type { Profile, Settings, WeightEntry } from '@/domain/types';
import type { WeightBmi } from '@/application/FitnessService';
import { filterWeightChartEntries, type WeightChartRange } from '@/domain/weightChart';
import { useFitnessService } from '@/providers/servicesContext';
import { useAppTheme } from '@/theme/theme';

type WeightView = 'trend' | 'summary' | 'statistics';

export default function WeightScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const { service } = useFitnessService();
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<WeightSummary | null>(null);
  const [saved, setSaved] = useState(false);
  const [range, setRange] = useState<WeightChartRange>('30d');
  const [view, setView] = useState<WeightView>('trend');
  const [bmis, setBmis] = useState<Record<string, WeightBmi>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WeightEntry | null>(null);
  const load = useCallback(() => {
    void Promise.all([service.listWeights(), service.getSettings(), service.getProfile()]).then(
      async ([items, currentSettings, currentProfile]) => {
        setEntries(items);
        setSettings(currentSettings);
        setProfile(currentProfile);
        setSummary(calculateWeightSummary(items, currentProfile?.targetWeightKg ?? null));
        setBmis(await service.getWeightBmis(items));
      },
    );
  }, [service]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  if (!settings)
    return (
      <Screen>
        <AppText>{t('common.loading')}</AppText>
      </Screen>
    );
  const unit = settings.unitSystem === 'metric' ? t('common.kg') : t('common.lb');
  const format = (kg: number) => `${roundTo(kgToDisplay(kg, settings.unitSystem), 1)} ${unit}`;
  const visibleEntries = filterWeightChartEntries(entries, range);
  const visibleSelection = selectedEntry ?? visibleEntries.at(-1) ?? summary?.latest ?? null;
  const selectedBmi = visibleSelection ? bmis[visibleSelection.id] : undefined;
  // "Registrar peso" is longer in Spanish. On phone widths it deliberately
  // occupies its own line instead of competing with the title.
  const compactHeader = width < 560 || fontScale > 1.0;
  const add = async () => {
    const parsed = parseDecimalInput(weight);
    if (parsed === null || parsed <= 0) return;
    await service.addWeight(displayToKg(parsed, settings.unitSystem), note);
    setWeight('');
    setNote('');
    setFormOpen(false);
    setSaved(true);
    load();
  };
  const trendValue =
    summary?.linearTrend30dKgPerWeek === null
      ? t('weight.insufficient')
      : summary?.linearTrend30dKgPerWeek !== undefined
        ? `${summary.linearTrend30dKgPerWeek > 0 ? '+' : ''}${format(summary.linearTrend30dKgPerWeek)} ${t('weight.perWeek')}`
        : '—';

  return (
    <Screen>
      <View style={[styles.header, compactHeader && styles.headerCompact]}>
        <View>
          <AppText variant="caption" style={{ color: theme.accentStrong }}>
            {t('weight.chartTitle')}
          </AppText>
          <AppText variant="display">{t('weight.title')}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('weight.add')}
          onPress={() => setFormOpen(true)}
          style={({ pressed }) => [
            styles.addWeight,
            { backgroundColor: theme.accent, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Ionicons name="add" size={20} color={theme.accentOn} />
          <AppText variant="label" style={{ color: theme.accentOn }}>
            {t('weight.add')}
          </AppText>
        </Pressable>
      </View>
      {saved ? <InlineNotice tone="success">{t('feedback.weightLogged')}</InlineNotice> : null}
      <View
        style={[styles.viewTabs, { borderBottomColor: theme.border }]}
        accessibilityRole="tablist"
      >
        {(['trend', 'summary', 'statistics'] as WeightView[]).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === item }}
            onPress={() => setView(item)}
            style={[
              styles.viewTab,
              { borderBottomColor: view === item ? theme.accent : 'transparent' },
            ]}
          >
            <AppText
              variant="caption"
              style={{ color: view === item ? theme.accentStrong : theme.textMuted }}
            >
              {t(`weight.${item}`)}
            </AppText>
          </Pressable>
        ))}
      </View>
      {summary?.latest ? (
        <>
          {view === 'trend' ? (
            <>
              <View
                style={[
                  styles.chartPanel,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    shadowColor: theme.shadow.color,
                  },
                ]}
              >
                <View style={styles.chartTopline}>
                  <View>
                    <AppText variant="caption" style={{ color: theme.textSubtle }}>
                      {t('weight.current')}
                    </AppText>
                    <AppText variant="display" style={styles.currentWeight}>
                      {format(summary.latest.weightKg)}
                    </AppText>
                  </View>
                  {profile?.targetWeightKg ? (
                    <View
                      style={[
                        styles.goalChip,
                        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                      ]}
                    >
                      <Ionicons name="flag-outline" size={16} color={theme.cyan} />
                      <View>
                        <AppText variant="caption" style={{ color: theme.textSubtle }}>
                          {t('weight.progress')}
                        </AppText>
                        <AppText variant="caption">{format(profile.targetWeightKg)}</AppText>
                      </View>
                    </View>
                  ) : null}
                </View>
                <ChoiceRow
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: '7d', label: '7 d' },
                    { value: '30d', label: '30 d' },
                    { value: '90d', label: '90 d' },
                    { value: 'all', label: t('weight.all') },
                  ]}
                />
                <WeightTrendChart
                  entries={visibleEntries}
                  format={format}
                  height={252}
                  targetKg={profile?.targetWeightKg ?? null}
                  onSelectionChange={setSelectedEntry}
                />
              </View>
              {visibleSelection ? (
                <View
                  style={[
                    styles.selection,
                    { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                  ]}
                >
                  <View>
                    <AppText variant="caption" style={{ color: theme.textSubtle }}>
                      {visibleSelection.localDate}
                    </AppText>
                    <AppText variant="title">{format(visibleSelection.weightKg)}</AppText>
                  </View>
                  {selectedBmi ? (
                    <View style={styles.selectionAside}>
                      <AppText variant="caption" style={{ color: theme.textMuted }}>
                        {t('weight.bmi', { value: selectedBmi.value.toFixed(1) })}
                      </AppText>
                      {selectedBmi.heightSource === 'current' ? (
                        <AppText variant="caption" style={{ color: theme.textSubtle }}>
                          {t('weight.bmiCurrentHeight')}
                        </AppText>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}
              <MetricStrip
                summary={summary}
                format={format}
                trendValue={trendValue}
                target={profile?.targetWeightKg ?? null}
              />
            </>
          ) : null}
          {view === 'summary' ? (
            <View
              style={[
                styles.summaryPanel,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <MetricStrip
                summary={summary}
                format={format}
                trendValue={trendValue}
                target={profile?.targetWeightKg ?? null}
                vertical
              />
              <View style={[styles.goalProgress, { backgroundColor: theme.surfaceMuted }]}>
                <AppText variant="caption" style={{ color: theme.textMuted }}>
                  {t('weight.progress')}
                </AppText>
                <AppText variant="subtitle">
                  {summary.goalProgress === null
                    ? '—'
                    : `${Math.round(summary.goalProgress * 100)}%`}
                </AppText>
              </View>
            </View>
          ) : null}
          {view === 'statistics' ? (
            <View
              style={[
                styles.statPanel,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <AppText variant="subtitle">{t('weight.history')}</AppText>
              <AppText variant="caption" style={{ color: theme.textMuted }}>
                {t('weight.trend')}: {trendValue}
              </AppText>
              <AppText variant="caption" style={{ color: theme.textMuted }}>
                {t('weight.movingAverage')}:{' '}
                {format(summary.movingAverage7dKg ?? summary.latest.weightKg)}
              </AppText>
              <AppText variant="caption" style={{ color: theme.textMuted }}>
                {t('weight.progress')}:{' '}
                {profile?.targetWeightKg ? format(profile.targetWeightKg) : '—'}
              </AppText>
            </View>
          ) : null}
        </>
      ) : (
        <View style={[styles.emptyTrend, { borderColor: theme.border }]}>
          <Ionicons name="analytics-outline" size={30} color={theme.accentStrong} />
          <AppText variant="subtitle">{t('common.noData')}</AppText>
          <AppText muted>{t('weight.subtitle')}</AppText>
          <Button label={t('weight.add')} onPress={() => setFormOpen(true)} />
        </View>
      )}
      <View style={styles.history}>
        <View style={styles.historyTitle}>
          <AppText variant="label" style={{ color: theme.textMuted }}>
            {t('weight.history')}
          </AppText>
          <AppText variant="caption" style={{ color: theme.accentStrong }}>
            {entries.length}
          </AppText>
        </View>
        {[...entries]
          .reverse()
          .slice(0, 8)
          .map((entry) => {
            const bmi = bmis[entry.id];
            return (
              <View
                key={entry.id}
                style={[
                  styles.historyRow,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View>
                  <AppText variant="caption" style={{ color: theme.textSubtle }}>
                    {entry.localDate}
                  </AppText>
                  <AppText variant="subtitle">{format(entry.weightKg)}</AppText>
                </View>
                <View style={styles.historyAside}>
                  {bmi ? (
                    <AppText variant="caption" style={{ color: theme.textMuted }}>
                      {t('weight.bmi', { value: bmi.value.toFixed(1) })}
                    </AppText>
                  ) : null}
                  {entry.note ? (
                    <AppText variant="caption" style={{ color: theme.textSubtle }}>
                      {entry.note}
                    </AppText>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={theme.textSubtle} />
                  )}
                </View>
              </View>
            );
          })}
      </View>
      <Modal
        transparent
        visible={formOpen}
        animationType="slide"
        onRequestClose={() => setFormOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            accessibilityViewIsModal
            style={[
              styles.weightEditor,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.borderStrong }]} />
            <AppText variant="title">{t('weight.add')}</AppText>
            <Field
              label={`${t('weight.add')} (${unit})`}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />
            <Field label={t('weight.note')} value={note} onChangeText={setNote} />
            <Button
              label={t('weight.add')}
              onPress={() => void add()}
              disabled={(parseDecimalInput(weight) ?? 0) <= 0}
            />
            <Button label={t('common.cancel')} variant="ghost" onPress={() => setFormOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function MetricStrip({
  summary,
  format,
  trendValue,
  target,
  vertical = false,
}: {
  summary: WeightSummary;
  format: (kg: number) => string;
  trendValue: string;
  target: number | null;
  vertical?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const values = [
    [t('weight.movingAverage'), format(summary.movingAverage7dKg ?? summary.latest?.weightKg ?? 0)],
    [t('weight.trend'), trendValue],
    [t('weight.progress'), target ? format(target) : '—'],
  ];
  return (
    <View style={[styles.metricStrip, vertical && styles.metricStacked]}>
      {values.map(([label, value], index) => (
        <View
          key={label}
          style={[
            styles.metric,
            {
              borderRightColor:
                index === values.length - 1 || vertical ? 'transparent' : theme.border,
            },
          ]}
        >
          <AppText variant="caption" style={{ color: theme.textSubtle }}>
            {label}
          </AppText>
          <AppText variant="subtitle" style={styles.metricValue}>
            {value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 10,
  },
  headerCompact: { alignItems: 'flex-start', flexDirection: 'column' },
  addWeight: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewTabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  viewTab: {
    flex: 1,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
  chartPanel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 15,
    gap: 13,
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  chartTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  currentWeight: { fontVariant: ['tabular-nums'], fontSize: 40, lineHeight: 46 },
  goalChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  selection: {
    minHeight: 72,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectionAside: { alignItems: 'flex-end', flex: 1, gap: 2 },
  metricStrip: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000000',
    borderRadius: 14,
    paddingVertical: 8,
  },
  metricStacked: { flexDirection: 'column', gap: 8, paddingHorizontal: 0 },
  metric: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingHorizontal: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  metricValue: { fontVariant: ['tabular-nums'], fontSize: 15, lineHeight: 20 },
  summaryPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16, gap: 14 },
  goalProgress: { minHeight: 72, borderRadius: 12, padding: 13, justifyContent: 'center', gap: 2 },
  statPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16, gap: 11 },
  emptyTrend: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
  },
  history: { gap: 8 },
  historyTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyRow: {
    minHeight: 67,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyAside: { alignItems: 'flex-end', maxWidth: '48%', gap: 2 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2,3,12,0.72)',
    padding: 12,
  },
  weightEditor: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18, gap: 12 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, marginBottom: 2 },
});
