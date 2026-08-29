import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  Button,
  Card,
  ChoiceRow,
  Field,
  InlineNotice,
  ProgressBar,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { parseDecimalInput } from '@/domain/numericInput';
import { displayToKg, kgToDisplay, roundTo } from '@/domain/units';
import { calculateWeightSummary, type WeightSummary } from '@/domain/weightTrend';
import { WeightTrendChart } from '@/components/WeightTrendChart';
import type { Profile, Settings, WeightEntry } from '@/domain/types';
import type { WeightBmi } from '@/application/FitnessService';
import { filterWeightChartEntries, type WeightChartRange } from '@/domain/weightChart';
import { useFitnessService } from '@/providers/servicesContext';

export default function WeightScreen() {
  const { t } = useTranslation();
  const { service } = useFitnessService();
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<WeightSummary | null>(null);
  const [saved, setSaved] = useState(false);
  const [range, setRange] = useState<WeightChartRange>('30d');
  const [bmis, setBmis] = useState<Record<string, WeightBmi>>({});
  const load = useCallback(() => {
    Promise.all([service.listWeights(), service.getSettings(), service.getProfile()]).then(
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
  const latestBmi = summary?.latest ? bmis[summary.latest.id] : undefined;
  const add = async () => {
    const parsed = parseDecimalInput(weight);
    if (parsed === null || parsed <= 0) return;
    await service.addWeight(displayToKg(parsed, settings.unitSystem), note);
    setWeight('');
    setNote('');
    setSaved(true);
    load();
  };
  return (
    <Screen>
      <AppText variant="display">{t('weight.title')}</AppText>
      <AppText muted>{t('weight.subtitle')}</AppText>
      {saved ? <InlineNotice tone="success">{t('feedback.weightLogged')}</InlineNotice> : null}
      <Card>
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
      </Card>
      {summary?.latest ? (
        <>
          <Card>
            <AppText variant="label" muted>
              {t('weight.current')}
            </AppText>
            <AppText variant="display">{format(summary.latest.weightKg)}</AppText>
            {summary.latestChangeKg !== null ? (
              <AppText muted>
                {t('weight.lastChange')}: {summary.latestChangeKg > 0 ? '+' : ''}
                {format(summary.latestChangeKg)}
              </AppText>
            ) : null}
            {latestBmi ? (
              <AppText variant="caption" muted>
                {t('weight.bmi', {
                  value: latestBmi.value.toFixed(1),
                })}
                {latestBmi.heightSource === 'current' ? ` ${t('weight.bmiCurrentHeight')}` : null}
              </AppText>
            ) : null}
          </Card>
          <Card>
            <AppText variant="subtitle">{t('weight.chartTitle')}</AppText>
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
            <WeightTrendChart entries={filterWeightChartEntries(entries, range)} format={format} />
          </Card>
          <Card>
            <AppText variant="subtitle">{t('weight.movingAverage')}</AppText>
            <AppText variant="title">
              {format(summary.movingAverage7dKg ?? summary.latest.weightKg)}
            </AppText>
            <AppText variant="caption" muted>
              {t('weight.movingAverageHelp')}
            </AppText>
          </Card>
          <Card>
            <AppText variant="subtitle">{t('weight.trend')}</AppText>
            {summary.linearTrend30dKgPerWeek === null ? (
              <AppText muted>{t('weight.insufficient')}</AppText>
            ) : (
              <AppText variant="title">
                {summary.linearTrend30dKgPerWeek > 0 ? '+' : ''}
                {format(summary.linearTrend30dKgPerWeek)} {t('weight.perWeek')}
              </AppText>
            )}
            <AppText variant="caption" muted>
              {t('weight.trendHelp')}
            </AppText>
          </Card>
          {summary.goalProgress !== null && profile ? (
            <Card>
              <AppText variant="subtitle">{t('weight.progress')}</AppText>
              <ProgressBar value={summary.goalProgress} />
              <View style={styles.between}>
                <AppText muted>{Math.round(summary.goalProgress * 100)}%</AppText>
                <AppText muted>{format(profile.targetWeightKg)}</AppText>
              </View>
            </Card>
          ) : null}
        </>
      ) : null}
      <SectionHeader title={t('weight.history')} />
      {entries.length === 0 ? (
        <Card>
          <AppText muted>{t('common.noData')}</AppText>
        </Card>
      ) : (
        [...entries].reverse().map((entry) => {
          const bmi = bmis[entry.id];
          return (
            <Card key={entry.id}>
              <View style={styles.between}>
                <AppText variant="subtitle">{format(entry.weightKg)}</AppText>
                <AppText muted>{entry.localDate}</AppText>
              </View>
              {entry.note ? <AppText muted>{entry.note}</AppText> : null}
              {bmi ? (
                <AppText variant="caption" muted>
                  {t('weight.bmi', { value: bmi.value.toFixed(1) })}
                </AppText>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
