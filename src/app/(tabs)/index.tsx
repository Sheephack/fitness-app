import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { DashboardData } from '@/application/FitnessService';
import { AppText, Button, InlineNotice, Screen } from '@/components/ui';
import { CalorieRing, MacroRangeBar, MacroRangeRing } from '@/components/NutritionVisuals';
import { kgToDisplay, roundTo } from '@/domain/units';
import type { LoggingPreferences, Settings } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';
import { useAppTheme } from '@/theme/theme';

const MACROS = [
  ['protein', 'proteinG'],
  ['carbs', 'carbsG'],
  ['fat', 'fatG'],
  ['fiber', 'fiberG'],
] as const;

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { service } = useFitnessService();
  const [data, setData] = useState<DashboardData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [preferences, setPreferences] = useState<LoggingPreferences | null>(null);
  const load = useCallback(() => {
    Promise.all([
      service.getDashboard(),
      service.getSettings(),
      service.getLoggingPreferences(),
    ]).then(([dashboard, currentSettings, currentPreferences]) => {
      setData(dashboard);
      setSettings(currentSettings);
      setPreferences(currentPreferences);
    });
  }, [service]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!data || !settings || !preferences) {
    return (
      <Screen>
        <AppText>{t('common.loading')}</AppText>
      </Screen>
    );
  }

  const number = new Intl.NumberFormat(settings.locale, { maximumFractionDigits: 1 });
  const caloriesKnown = data.nutritionComplete.calories;
  const calories = caloriesKnown ? data.totals.calories : 0;
  const remaining = data.goals ? Math.max(0, data.goals.caloriesTarget - calories) : 0;
  const unit = settings.unitSystem === 'metric' ? t('common.kg') : t('common.lb');

  return (
    <Screen>
      <View style={styles.heading}>
        <AppText variant="label" muted>
          {t('home.todaySnapshot')}
        </AppText>
        <AppText variant="title">{t('home.question')}</AppText>
      </View>
      {data.goals ? (
        <>
          <View
            style={[
              styles.hero,
              { backgroundColor: theme.surfaceAccent, borderColor: theme.border },
            ]}
          >
            <View style={styles.heroCopy}>
              <AppText variant="label" style={{ color: theme.accentInk }}>
                {t('home.energy')}
              </AppText>
              <AppText variant="caption" muted>
                {t('home.target', {
                  value: `${number.format(data.goals.caloriesTarget)} ${t('common.kcal')}`,
                })}
              </AppText>
              <AppText variant="title" style={styles.energyValue}>
                {caloriesKnown ? number.format(calories) : '—'}{' '}
                <AppText variant="caption">{t('common.kcal')}</AppText>
              </AppText>
              <AppText variant="caption" muted>
                {caloriesKnown
                  ? t('home.remaining', {
                      value: `${number.format(remaining)} ${t('common.kcal')}`,
                    })
                  : t('home.caloriesUnknown')}
              </AppText>
            </View>
            <CalorieRing
              value={calories}
              target={data.goals.caloriesTarget}
              label={t('home.consumedShort')}
            />
          </View>

          <View
            style={[
              styles.macroSurface,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <View style={styles.macroHeader}>
              <AppText variant="subtitle">{t('home.macroRanges')}</AppText>
              <AppText variant="caption" muted>
                {t('home.targetZone')}
              </AppText>
            </View>
            {preferences.dashboardVisualization === 'bars' ? (
              <View style={styles.barList}>
                {MACROS.map(([name, key]) => (
                  <MacroRangeBar
                    key={name}
                    label={t(`home.${name}`)}
                    value={data.totals[key]}
                    known={data.nutritionComplete[key]}
                    min={data.goals![name].min}
                    max={data.goals![name].max}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.ringList}>
                {MACROS.map(([name, key]) => (
                  <MacroRangeRing
                    key={name}
                    label={t(`home.${name}`)}
                    value={data.totals[key]}
                    known={data.nutritionComplete[key]}
                    min={data.goals![name].min}
                    max={data.goals![name].max}
                  />
                ))}
              </View>
            )}
          </View>

          {data.balance ? (
            <View
              style={[
                styles.decision,
                { borderLeftColor: theme.accent, backgroundColor: theme.surface },
              ]}
            >
              <AppText variant="label" muted>
                {t('home.nextMoveTitle')}
              </AppText>
              <AppText variant="subtitle">{t(`balance.${data.balance.nextMove.code}`)}</AppText>
              {data.balance.nextMove.proteinLowerG ? (
                <AppText muted>
                  {t('balance.proteinAmount', {
                    lower: data.balance.nextMove.proteinLowerG,
                    upper: data.balance.nextMove.proteinUpperG,
                  })}
                </AppText>
              ) : null}
            </View>
          ) : (
            <InlineNotice tone="warning">{t('home.partialNutrition')}</InlineNotice>
          )}
        </>
      ) : (
        <View
          style={[styles.emptyGoals, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <AppText variant="subtitle">{t('home.noGoalsTitle')}</AppText>
          <AppText muted>{t('home.noGoalsBody')}</AppText>
          <Button label={t('home.configureGoals')} onPress={() => router.push('/goals')} />
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/weight')}
        style={[styles.weightStrip, { borderColor: theme.border }]}
      >
        <View>
          <AppText variant="label" muted>
            {t('home.weightTrend')}
          </AppText>
          {data.weight.latest ? (
            <AppText variant="title">
              {number.format(
                roundTo(kgToDisplay(data.weight.latest.weightKg, settings.unitSystem), 1),
              )}{' '}
              {unit}
            </AppText>
          ) : (
            <AppText muted>{t('common.noData')}</AppText>
          )}
        </View>
        <View style={styles.weightAside}>
          <AppText variant="caption" muted>
            {t('home.movingAverage')}
          </AppText>
          <AppText>
            {data.weight.latest
              ? `${number.format(roundTo(kgToDisplay(data.weight.movingAverage7dKg ?? data.weight.latest.weightKg, settings.unitSystem), 1))} ${unit}`
              : '—'}
          </AppText>
        </View>
      </Pressable>
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
  heading: { gap: 2, paddingTop: 8 },
  hero: {
    minHeight: 172,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 26,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCopy: { flex: 1, gap: 4 },
  energyValue: { fontSize: 30, lineHeight: 36, fontVariant: ['tabular-nums'] },
  macroSurface: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16, gap: 14 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barList: { gap: 14 },
  ringList: { flexDirection: 'row', justifyContent: 'space-between', gap: 2 },
  decision: { borderLeftWidth: 4, borderRadius: 12, padding: 16, gap: 6 },
  emptyGoals: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18, gap: 10 },
  weightStrip: {
    minHeight: 88,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightAside: { alignItems: 'flex-end', gap: 3 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
