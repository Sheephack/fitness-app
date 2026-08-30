import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { DashboardData } from '@/application/FitnessService';
import { AppText, Button, InlineNotice, Screen } from '@/components/ui';
import { CalorieRing, MacroRangeBar, MacroRangeRing } from '@/components/NutritionVisuals';
import { kgToDisplay, roundTo } from '@/domain/units';
import type { LoggingPreferences, Profile, Settings } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';
import { useAppTheme } from '@/theme/theme';

const MACROS = [
  ['protein', 'proteinG', 'cyan', 'barbell-outline'],
  ['carbs', 'carbsG', 'amber', 'flash-outline'],
  ['fat', 'fatG', 'magenta', 'water-outline'],
  ['fiber', 'fiberG', 'turquoise', 'leaf-outline'],
] as const;

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { service } = useFitnessService();
  const [data, setData] = useState<DashboardData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<LoggingPreferences | null>(null);
  const load = useCallback(() => {
    void Promise.all([
      service.getDashboard(),
      service.getSettings(),
      service.getProfile(),
      service.getLoggingPreferences(),
    ]).then(([dashboard, currentSettings, currentProfile, currentPreferences]) => {
      setData(dashboard);
      setSettings(currentSettings);
      setProfile(currentProfile);
      setPreferences(currentPreferences);
    });
  }, [service]);
  useFocusEffect(useCallback(load, [load]));

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
  const today = new Intl.DateTimeFormat(settings.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'morning' : hour < 19 ? 'afternoon' : 'evening';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="subtitle">
            {t(`home.${salutation}`, { name: profile?.nickname || '—' })}
          </AppText>
          <AppText variant="caption" style={{ color: theme.textSubtle }}>
            {today}
          </AppText>
        </View>
      </View>

      {data.goals ? (
        <>
          <View
            style={[
              styles.energyPanel,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.shadow.color,
              },
            ]}
          >
            <View style={styles.energyCopy}>
              <View style={styles.energyLabel}>
                <Ionicons name="flash-outline" size={16} color={theme.accentStrong} />
                <AppText variant="label" style={{ color: theme.accentStrong }}>
                  {t('home.energy')}
                </AppText>
              </View>
              <View style={styles.energyNumberLine}>
                <AppText variant="display" style={[styles.energyValue, { color: theme.text }]}>
                  {caloriesKnown ? number.format(calories) : '—'}
                </AppText>
                <AppText variant="caption" style={{ color: theme.textMuted }}>
                  {t('common.kcal')}
                </AppText>
              </View>
              <AppText variant="caption" style={{ color: theme.textMuted }}>
                {t('home.target', { value: number.format(data.goals.caloriesTarget) })}
              </AppText>
            </View>
            <View style={[styles.ringGlow, { backgroundColor: theme.surfaceAccent }]}>
              <CalorieRing
                value={calories}
                target={data.goals.caloriesTarget}
                label={t('home.consumedShort')}
                size={120}
              />
            </View>
            <View
              style={[
                styles.remainingStrip,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
              ]}
            >
              <AppText variant="caption" style={{ color: theme.textMuted }}>
                {t('home.remainingLabel')}
              </AppText>
              <AppText variant="subtitle" style={{ color: theme.accentStrong }}>
                {caloriesKnown ? `${number.format(remaining)} ${t('common.kcal')}` : '—'}
              </AppText>
            </View>
          </View>

          <View style={styles.sectionLine}>
            <AppText variant="label" style={{ color: theme.textMuted }}>
              {t('home.macroRanges')}
            </AppText>
            <AppText variant="caption" style={{ color: theme.textSubtle }}>
              {t('home.targetZone')}
            </AppText>
          </View>
          <View
            style={
              preferences.dashboardVisualization === 'bars' ? styles.macroList : styles.macroGrid
            }
          >
            {MACROS.map(([name, key, colorKey, icon]) => {
              const color = theme[colorKey];
              return (
                <View
                  key={name}
                  style={[
                    preferences.dashboardVisualization === 'bars'
                      ? styles.macroListTile
                      : styles.macroTile,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.macroTileHeader}>
                    <View style={[styles.macroDot, { backgroundColor: color }]} />
                    <Ionicons name={icon} size={16} color={color} />
                  </View>
                  {preferences.dashboardVisualization === 'bars' ? (
                    <MacroRangeBar
                      label={t(`home.${name === 'carbs' ? 'carbsShort' : name}`)}
                      value={data.totals[key]}
                      known={data.nutritionComplete[key]}
                      min={data.goals![name].min}
                      max={data.goals![name].max}
                      color={color}
                    />
                  ) : (
                    <MacroRangeRing
                      label={t(`home.${name === 'carbs' ? 'carbsShort' : name}`)}
                      value={data.totals[key]}
                      known={data.nutritionComplete[key]}
                      min={data.goals![name].min}
                      max={data.goals![name].max}
                      color={color}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {data.balance ? (
            <View
              style={[
                styles.nextPanel,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.nextText}>
                <AppText variant="label" style={{ color: theme.accentStrong }}>
                  {t('home.nextMoveTitle')}
                </AppText>
                <AppText variant="subtitle">{t(`balance.${data.balance.nextMove.code}`)}</AppText>
                {data.balance.nextMove.proteinLowerG ? (
                  <AppText variant="caption" style={{ color: theme.textMuted }}>
                    {t('balance.proteinAmount', {
                      lower: data.balance.nextMove.proteinLowerG,
                      upper: data.balance.nextMove.proteinUpperG,
                    })}
                  </AppText>
                ) : null}
              </View>
              <Image
                source={require('../../../assets/images/nutrition/next-meal.png')}
                style={styles.nextImage}
                resizeMode="contain"
                accessibilityLabel={t('home.nextMoveTitle')}
              />
            </View>
          ) : (
            <InlineNotice tone="warning">{t('home.partialNutrition')}</InlineNotice>
          )}

          <Button label={`＋ ${t('home.logFood')}`} onPress={() => router.push('/add-food')} />
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
        accessibilityLabel={t('home.weightTrend')}
        onPress={() => router.push('/(tabs)/weight')}
        style={({ pressed }) => [
          styles.weightRail,
          { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View>
          <AppText variant="label" style={{ color: theme.textSubtle }}>
            {t('home.weightTrend')}
          </AppText>
          <AppText variant="title">
            {data.weight.latest
              ? `${number.format(roundTo(kgToDisplay(data.weight.latest.weightKg, settings.unitSystem), 1))} ${unit}`
              : '—'}
          </AppText>
        </View>
        <View style={styles.weightAside}>
          <AppText variant="caption" style={{ color: theme.textSubtle }}>
            {t('home.movingAverage')}
          </AppText>
          <AppText variant="subtitle">
            {data.weight.latest
              ? `${number.format(roundTo(kgToDisplay(data.weight.movingAverage7dKg ?? data.weight.latest.weightKg, settings.unitSystem), 1))} ${unit}`
              : '—'}
          </AppText>
        </View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  headerCopy: { gap: 2 },
  energyPanel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    minHeight: 224,
    padding: 18,
    overflow: 'hidden',
    shadowOpacity: 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  energyCopy: { gap: 5, maxWidth: '57%' },
  energyLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  energyNumberLine: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  energyValue: { fontSize: 43, lineHeight: 49, fontVariant: ['tabular-nums'], letterSpacing: -1.5 },
  ringGlow: {
    position: 'absolute',
    top: 24,
    right: 9,
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingStrip: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    minHeight: 48,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  macroList: { gap: 10 },
  macroTile: {
    width: '48.4%',
    minHeight: 168,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 9,
    gap: 7,
    overflow: 'hidden',
  },
  macroListTile: {
    minHeight: 112,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 7,
  },
  macroTileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  macroDot: { width: 7, height: 7, borderRadius: 4 },
  nextPanel: {
    minHeight: 146,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  nextText: { flex: 1, gap: 7, zIndex: 1, paddingRight: 144 },
  nextImage: {
    position: 'absolute',
    right: -8,
    bottom: -2,
    width: 178,
    height: 142,
    opacity: 1,
  },
  emptyGoals: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18, gap: 10 },
  weightRail: {
    minHeight: 79,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  weightAside: { alignItems: 'flex-end', maxWidth: '49%', gap: 3 },
});
