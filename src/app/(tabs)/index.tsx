import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { DashboardData } from '@/application/FitnessService';
import {
  AppText,
  Button,
  Card,
  InlineNotice,
  ProgressBar,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { kgToDisplay, roundTo } from '@/domain/units';
import type { Settings } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';

function Metric({
  label,
  value,
  target,
  progress,
}: {
  label: string;
  value: string;
  target: string;
  progress: number;
}) {
  return (
    <Card style={styles.metric}>
      <View style={styles.metricTop}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="subtitle">{value}</AppText>
      </View>
      <ProgressBar value={progress} />
      <AppText variant="caption" muted>
        {target}
      </AppText>
    </Card>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { service } = useFitnessService();
  const [data, setData] = useState<DashboardData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const load = useCallback(() => {
    Promise.all([service.getDashboard(), service.getSettings()]).then(
      ([dashboard, currentSettings]) => {
        setData(dashboard);
        setSettings(currentSettings);
      },
    );
  }, [service]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  if (!data || !settings)
    return (
      <Screen>
        <AppText>{t('common.loading')}</AppText>
      </Screen>
    );
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 19 ? 'afternoon' : 'evening';
  const number = new Intl.NumberFormat(settings.locale, { maximumFractionDigits: 1 });
  const unit = settings.unitSystem === 'metric' ? t('common.kg') : t('common.lb');
  return (
    <Screen>
      <AppText variant="subtitle">
        {t(`home.${greeting}`, { name: data.profile?.nickname ?? '' })}
      </AppText>
      <AppText variant="display">{t('home.question')}</AppText>
      {data.goals ? (
        <>
          <View style={styles.grid}>
            <Metric
              label={t('home.calories')}
              value={data.nutritionComplete.calories ? number.format(data.totals.calories) : '—'}
              target={t('home.target', {
                value: `${number.format(data.goals.caloriesTarget)} ${t('common.kcal')}`,
              })}
              progress={
                data.nutritionComplete.calories
                  ? data.totals.calories / data.goals.caloriesTarget
                  : 0
              }
            />
            {(
              [
                ['protein', 'proteinG'],
                ['carbs', 'carbsG'],
                ['fat', 'fatG'],
                ['fiber', 'fiberG'],
              ] as const
            ).map(([name, key]) => (
              <Metric
                key={name}
                label={t(`home.${name}`)}
                value={data.nutritionComplete[key] ? `${number.format(data.totals[key])} g` : '—'}
                target={t('home.range', {
                  min: number.format(data.goals![name].min),
                  max: number.format(data.goals![name].max),
                })}
                progress={
                  data.nutritionComplete[key] ? data.totals[key] / data.goals![name].max : 0
                }
              />
            ))}
          </View>
          <SectionHeader title={t('home.balanceTitle')} />
          {data.balance ? (
            <>
              <Card>
                {data.balance.insights.map((code) => (
                  <AppText key={code}>{t(`balance.${code}`)}</AppText>
                ))}
              </Card>
              <SectionHeader title={t('home.nextMoveTitle')} />
              <Card>
                <AppText variant="subtitle">{t(`balance.${data.balance.nextMove.code}`)}</AppText>
                {data.balance.nextMove.proteinLowerG ? (
                  <AppText muted>
                    {t('balance.proteinAmount', {
                      lower: data.balance.nextMove.proteinLowerG,
                      upper: data.balance.nextMove.proteinUpperG,
                    })}
                  </AppText>
                ) : null}
              </Card>
            </>
          ) : (
            <InlineNotice tone="warning">{t('home.partialNutrition')}</InlineNotice>
          )}
        </>
      ) : (
        <Card>
          <AppText variant="subtitle">{t('home.noGoalsTitle')}</AppText>
          <AppText muted>{t('home.noGoalsBody')}</AppText>
          <Button label={t('home.configureGoals')} onPress={() => router.push('/goals')} />
        </Card>
      )}
      <SectionHeader title={t('home.weightTrend')} />
      <Card>
        {data.weight.latest ? (
          <>
            <AppText variant="title">
              {number.format(
                roundTo(kgToDisplay(data.weight.latest.weightKg, settings.unitSystem), 1),
              )}{' '}
              {unit}
            </AppText>
            <AppText muted>
              {t('home.movingAverage')}:{' '}
              {number.format(
                roundTo(
                  kgToDisplay(
                    data.weight.movingAverage7dKg ?? data.weight.latest.weightKg,
                    settings.unitSystem,
                  ),
                  1,
                ),
              )}{' '}
              {unit}
            </AppText>
            {data.weight.linearTrend30dKgPerWeek === null ? (
              <AppText variant="caption" muted>
                {t('home.insufficientTrend')}
              </AppText>
            ) : (
              <AppText>
                {t('home.trendValue', {
                  value: number.format(
                    roundTo(
                      kgToDisplay(data.weight.linearTrend30dKgPerWeek, settings.unitSystem),
                      2,
                    ),
                  ),
                  unit,
                })}
              </AppText>
            )}
          </>
        ) : (
          <AppText muted>{t('common.noData')}</AppText>
        )}
      </Card>
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button label={`+ ${t('home.logFood')}`} onPress={() => router.push('/(tabs)/journal')} />
        </View>
        <View style={styles.action}>
          <Button
            label={`+ ${t('home.logWeight')}`}
            variant="secondary"
            onPress={() => router.push('/(tabs)/weight')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  metric: { padding: 14 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
