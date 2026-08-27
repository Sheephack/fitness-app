import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  Button,
  Card,
  ChoiceRow,
  Field,
  InlineNotice,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { localDateFromDate } from '@/domain/localDate';
import { scaleNutrition, totalNutrition } from '@/domain/nutrition';
import type { FoodLogEntry, MealTemplate, MealType } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';
import { useAppTheme } from '@/theme/theme';

const MEALS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];

export default function JournalScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { service } = useFitnessService();
  const params = useLocalSearchParams<{ feedback?: string }>();
  const today = localDateFromDate(new Date());
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [duplicable, setDuplicable] = useState<MealType[]>([]);
  const [savingMeal, setSavingMeal] = useState<MealType | null>(null);
  const [mealName, setMealName] = useState('');
  const [templateMeal, setTemplateMeal] = useState<MealType>('breakfast');

  const load = useCallback(() => {
    void service.getJournalDay(today).then((data) => {
      setEntries(data.entries);
      setTemplates(data.templates);
      setDuplicable(data.duplicableMeals);
    });
  }, [service, today]);
  useFocusEffect(useCallback(load, [load]));

  const groups = useMemo(
    () =>
      Object.fromEntries(
        MEALS.map((type) => [type, entries.filter((entry) => entry.mealType === type)]),
      ) as Record<MealType, FoodLogEntry[]>,
    [entries],
  );

  const duplicate = async (type: MealType) => {
    await service.duplicateYesterday(type, today);
    load();
  };
  const saveMeal = async (type: MealType) => {
    if (!mealName.trim()) return;
    await service.saveMealTemplate({ name: mealName, localDate: today, mealType: type });
    setMealName('');
    setSavingMeal(null);
    load();
  };

  const feedback =
    params.feedback === 'food_logged'
      ? t('feedback.foodLogged')
      : params.feedback === 'meal_logged'
        ? t('feedback.mealLogged')
        : null;

  return (
    <Screen>
      <AppText variant="display">{t('journal.title')}</AppText>
      <AppText muted>{t('journal.subtitle', { date: today })}</AppText>
      {feedback ? <InlineNotice tone="success">{feedback}</InlineNotice> : null}

      {MEALS.map((type) => {
        const mealEntries = groups[type] ?? [];
        const totals = totalNutrition(mealEntries);
        return (
          <View key={type} style={styles.section}>
            <View style={styles.mealHeader}>
              <AppText variant="subtitle">{t(`journal.${type}`)}</AppText>
              <AppText variant="label" muted>
                {mealEntries.length ? `${Math.round(totals.calories)} kcal` : '—'}
              </AppText>
            </View>
            <Card style={styles.mealCard}>
              {mealEntries.map((entry) => {
                const values = scaleNutrition(entry.snapshot, entry.quantity);
                return (
                  <View key={entry.id} style={[styles.logRow, { borderBottomColor: theme.border }]}>
                    <View style={styles.grow}>
                      <AppText>{entry.snapshot.foodName}</AppText>
                      <AppText variant="caption" muted>
                        {Math.round(entry.snapshot.servingGrams * entry.quantity)} g ·{' '}
                        {Math.round(values.calories)} kcal
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('common.delete')}
                      hitSlop={10}
                      onPress={() => void service.removeFoodLogEntry(entry.id).then(load)}
                    >
                      <AppText style={{ color: theme.danger }}>×</AppText>
                    </Pressable>
                  </View>
                );
              })}
              {!mealEntries.length ? (
                <AppText variant="caption" muted>
                  {t('journal.emptyMeal')}
                </AppText>
              ) : null}
              <Button
                label={`+ ${t('journal.addFood')}`}
                onPress={() =>
                  router.push({
                    pathname: '/add-food',
                    params: { mealType: type, localDate: today },
                  })
                }
              />
              {duplicable.includes(type) || mealEntries.length ? (
                <View style={styles.secondaryActions}>
                  {duplicable.includes(type) ? (
                    <Button
                      label={t('journal.duplicateYesterday')}
                      variant="secondary"
                      onPress={() => void duplicate(type)}
                    />
                  ) : null}
                  {mealEntries.length ? (
                    <Button
                      label={t('journal.saveMeal')}
                      variant="ghost"
                      onPress={() => {
                        setSavingMeal(type);
                        setMealName('');
                      }}
                    />
                  ) : null}
                </View>
              ) : null}
              {savingMeal === type ? (
                <View style={styles.saveMeal}>
                  <Field
                    label={t('journal.mealName')}
                    value={mealName}
                    onChangeText={setMealName}
                    autoFocus
                  />
                  <Button
                    label={t('journal.saveMeal')}
                    disabled={!mealName.trim()}
                    onPress={() => void saveMeal(type)}
                  />
                  <Button
                    label={t('common.cancel')}
                    variant="ghost"
                    onPress={() => setSavingMeal(null)}
                  />
                </View>
              ) : null}
            </Card>
          </View>
        );
      })}

      {templates.length ? (
        <>
          <SectionHeader title={t('journal.savedMeals')} />
          <ChoiceRow
            value={templateMeal}
            onChange={setTemplateMeal}
            options={MEALS.map((value) => ({ value, label: t(`journal.${value}`) }))}
          />
          {templates.map((template) => (
            <Card key={template.id} style={styles.templateCard}>
              <View style={styles.templateRow}>
                <View style={styles.grow}>
                  <AppText variant="subtitle">{template.name}</AppText>
                  <AppText variant="caption" muted>
                    {t('journal.itemCount', { count: template.items.length })}
                  </AppText>
                </View>
                <Button
                  label={t('journal.logMeal')}
                  variant="secondary"
                  onPress={() => void service.logMealTemplate(template, templateMeal).then(load)}
                />
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealCard: { padding: 14, gap: 8 },
  grow: { flex: 1 },
  logRow: {
    minHeight: 48,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  secondaryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  saveMeal: { gap: 8, paddingTop: 6 },
  templateCard: { paddingVertical: 12 },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
