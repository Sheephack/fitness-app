import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  Button,
  ChoiceRow,
  Field,
  InlineNotice,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { localDateFromDate } from '@/domain/localDate';
import { parseDecimalInput } from '@/domain/numericInput';
import { scaleNutrition, totalNutrition } from '@/domain/nutrition';
import type { FoodLogEntry, MealTemplate, MealType } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';
import { useAppTheme } from '@/theme/theme';

const MEALS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];

function entryAmount(entry: FoodLogEntry): string {
  if (entry.quantityUnit === 'grams') return `${Math.round(entry.quantityAmount)} g`;
  if (entry.quantityUnit === 'milliliters') return `${Math.round(entry.quantityAmount)} ml`;
  return `${entry.quantityAmount}×`;
}

export default function JournalScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { service } = useFitnessService();
  const params = useLocalSearchParams<{ feedback?: string }>();
  const today = localDateFromDate(new Date());
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [duplicable, setDuplicable] = useState<MealType[]>([]);
  const [expanded, setExpanded] = useState<MealType | null>('breakfast');
  const [undoEntry, setUndoEntry] = useState<FoodLogEntry | null>(null);
  const [editing, setEditing] = useState<FoodLogEntry | null>(null);
  const [editingAmount, setEditingAmount] = useState('1');
  const [editingMeal, setEditingMeal] = useState<MealType>('breakfast');
  const [savingMeal, setSavingMeal] = useState<MealType | null>(null);
  const [mealName, setMealName] = useState('');
  const [templateMeal, setTemplateMeal] = useState<MealType>('breakfast');

  const load = useCallback(() => {
    void service.getJournalDay(today).then((data) => {
      setEntries(data.entries);
      setTemplates(data.templates);
      setDuplicable(data.duplicableMeals);
      setExpanded((current) => current ?? data.entries.at(0)?.mealType ?? 'breakfast');
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
  const openEntry = (entry: FoodLogEntry) => {
    setEditing(entry);
    setEditingAmount(String(entry.quantityAmount));
    setEditingMeal(entry.mealType);
  };
  const removeEntry = async (entry: FoodLogEntry) => {
    const removed = await service.removeFoodLogEntry(entry.id, today);
    if (removed) setUndoEntry(removed);
    setEditing(null);
    load();
  };
  const saveEntry = async () => {
    if (!editing) return;
    const amount = parseDecimalInput(editingAmount);
    if (!amount || amount <= 0) return;
    await service.updateFoodLogEntry(editing.id, today, {
      mealType: editingMeal,
      amount,
      unit: editing.quantityUnit,
    });
    setEditing(null);
    load();
  };
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
      <View style={styles.pageTitle}>
        <AppText variant="label" muted>
          {today}
        </AppText>
        <AppText variant="display">{t('journal.title')}</AppText>
        <AppText muted>{t('journal.compactSubtitle')}</AppText>
      </View>
      {feedback ? <InlineNotice tone="success">{feedback}</InlineNotice> : null}
      {undoEntry ? (
        <InlineNotice tone="warning">
          <View style={styles.undoRow}>
            <AppText>{t('journal.removed')}</AppText>
            <Button
              label={t('common.undo')}
              variant="ghost"
              onPress={() =>
                void service.restoreFoodLogEntry(undoEntry).then(() => {
                  setUndoEntry(null);
                  load();
                })
              }
            />
          </View>
        </InlineNotice>
      ) : null}

      <View
        style={[styles.mealStack, { borderColor: theme.border, backgroundColor: theme.surface }]}
      >
        {MEALS.map((type) => {
          const mealEntries = groups[type] ?? [];
          const totals = totalNutrition(mealEntries);
          const isOpen = expanded === type;
          return (
            <View key={type} style={[styles.mealGroup, { borderBottomColor: theme.border }]}>
              <View style={styles.mealHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(isOpen ? 'journal.collapseMeal' : 'journal.expandMeal', {
                    meal: t(`journal.${type}`),
                  })}
                  onPress={() => setExpanded(isOpen ? null : type)}
                  style={styles.mealToggle}
                >
                  <View style={styles.mealMain}>
                    <AppText variant="subtitle">{t(`journal.${type}`)}</AppText>
                    <AppText variant="caption" muted>
                      {mealEntries.length
                        ? t('journal.mealSummary', {
                            count: mealEntries.length,
                            calories: Math.round(totals.calories),
                          })
                        : t('journal.emptyMeal')}
                    </AppText>
                  </View>
                  <AppText muted>{isOpen ? '⌃' : '⌄'}</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('journal.addFood')} ${t(`journal.${type}`)}`}
                  onPress={() =>
                    router.push({
                      pathname: '/add-food',
                      params: { mealType: type, localDate: today },
                    })
                  }
                  style={[styles.addControl, { backgroundColor: theme.surfaceAccent }]}
                >
                  <AppText style={{ color: theme.accentStrong }}>+</AppText>
                </Pressable>
              </View>
              {isOpen ? (
                <View style={styles.mealBody}>
                  {mealEntries.map((entry) => {
                    const values = scaleNutrition(entry.snapshot, entry.quantity);
                    return (
                      <Pressable
                        key={entry.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${entry.snapshot.foodName}, ${entryAmount(entry)}, ${Math.round(values.calories)} kcal`}
                        onPress={() => openEntry(entry)}
                        style={[styles.logRow, { borderTopColor: theme.border }]}
                      >
                        <View style={styles.grow}>
                          <AppText>{entry.snapshot.foodName}</AppText>
                          <AppText variant="caption" muted>
                            {entryAmount(entry)} · {Math.round(values.calories)} kcal
                          </AppText>
                        </View>
                        <AppText variant="caption" muted>
                          {t('common.edit')}
                        </AppText>
                      </Pressable>
                    );
                  })}
                  {!mealEntries.length ? (
                    <AppText variant="caption" muted>
                      {t('journal.emptyMeal')}
                    </AppText>
                  ) : null}
                  <View style={styles.mealActions}>
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
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {templates.length ? (
        <>
          <SectionHeader title={t('journal.savedMeals')} />
          <ChoiceRow
            value={templateMeal}
            onChange={setTemplateMeal}
            options={MEALS.map((value) => ({ value, label: t(`journal.${value}`) }))}
          />
          <View style={styles.templateList}>
            {templates.map((template) => (
              <Pressable
                key={template.id}
                accessibilityRole="button"
                onPress={() => void service.logMealTemplate(template, templateMeal).then(load)}
                style={[styles.templateRow, { borderColor: theme.border }]}
              >
                <View style={styles.grow}>
                  <AppText variant="subtitle">{template.name}</AppText>
                  <AppText variant="caption" muted>
                    {t('journal.itemCount', { count: template.items.length })}
                  </AppText>
                </View>
                <AppText style={{ color: theme.accentStrong }}>{t('journal.logMeal')}</AppText>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Modal
        transparent
        visible={Boolean(editing)}
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            accessibilityViewIsModal
            style={[styles.editor, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppText variant="title">{editing?.snapshot.foodName}</AppText>
            <Field
              label={t('journal.quantity')}
              keyboardType="decimal-pad"
              value={editingAmount}
              onChangeText={setEditingAmount}
            />
            <AppText variant="label">{t('journal.meal')}</AppText>
            <ChoiceRow
              value={editingMeal}
              onChange={setEditingMeal}
              options={MEALS.map((value) => ({ value, label: t(`journal.${value}`) }))}
            />
            <Button label={t('common.save')} onPress={() => void saveEntry()} />
            {editing ? (
              <Button
                label={t('common.delete')}
                variant="danger"
                onPress={() => void removeEntry(editing)}
              />
            ) : null}
            <Button label={t('common.cancel')} variant="ghost" onPress={() => setEditing(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { gap: 3, paddingTop: 8 },
  undoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  mealStack: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, overflow: 'hidden' },
  mealGroup: { borderBottomWidth: StyleSheet.hairlineWidth },
  mealHeader: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 10,
    gap: 10,
  },
  mealToggle: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mealMain: { flex: 1, gap: 2 },
  addControl: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealBody: { paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  logRow: {
    minHeight: 54,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  grow: { flex: 1 },
  mealActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 2 },
  saveMeal: { gap: 8 },
  templateList: { gap: 8 },
  templateRow: {
    minHeight: 62,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 18, 13, 0.36)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  editor: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 26, padding: 18, gap: 12 },
});
