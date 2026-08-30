import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Button, ChoiceRow, Field, InlineNotice, Screen } from '@/components/ui';
import { localDateFromDate } from '@/domain/localDate';
import { parseDecimalInput } from '@/domain/numericInput';
import { scaleNutrition, totalNutrition } from '@/domain/nutrition';
import type { FoodLogEntry, MealTemplate, MealType } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';
import { useAppTheme } from '@/theme/theme';

const MEALS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];
const MEAL_ICONS: Record<MealType, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'cafe-outline',
  lunch: 'restaurant-outline',
  snack: 'heart-outline',
  dinner: 'moon-outline',
  other: 'ellipsis-horizontal',
};
const MACRO_COLORS = ['cyan', 'turquoise', 'amber', 'magenta'] as const;

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
  const [activeMeal, setActiveMeal] = useState<MealType>('breakfast');
  const [undoEntry, setUndoEntry] = useState<FoodLogEntry | null>(null);
  const [editing, setEditing] = useState<FoodLogEntry | null>(null);
  const [editingAmount, setEditingAmount] = useState('1');
  const [editingMeal, setEditingMeal] = useState<MealType>('breakfast');
  const [savingMeal, setSavingMeal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [templateMeal, setTemplateMeal] = useState<MealType>('breakfast');

  const load = useCallback(() => {
    void service.getJournalDay(today).then((data) => {
      setEntries(data.entries);
      setTemplates(data.templates);
      setDuplicable(data.duplicableMeals);
      setActiveMeal((current) => current ?? data.entries.at(0)?.mealType ?? 'breakfast');
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
  const activeEntries = groups[activeMeal] ?? [];
  const activeTotals = totalNutrition(activeEntries);
  const dayTotals = totalNutrition(entries);
  const feedback =
    params.feedback === 'food_logged'
      ? t('feedback.foodLogged')
      : params.feedback === 'meal_logged'
        ? t('feedback.mealLogged')
        : null;
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

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="caption" style={{ color: theme.textSubtle }}>
          {today}
        </AppText>
        <View style={styles.headerLine}>
          <AppText variant="display">{t('journal.title')}</AppText>
          <View style={styles.energyReadout}>
            <AppText variant="caption" style={{ color: theme.textSubtle }}>
              {t('home.energy')}
            </AppText>
            <AppText variant="subtitle">
              {Math.round(dayTotals.calories)} {t('common.kcal')}
            </AppText>
          </View>
        </View>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.mealRailScroll}
        contentContainerStyle={styles.mealRail}
        accessibilityRole="tablist"
      >
        {MEALS.map((type) => {
          const active = activeMeal === type;
          const count = groups[type].length;
          return (
            <Pressable
              key={type}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${t(`journal.${type}`)}. ${count} ${t('journal.itemCount', { count })}`}
              onPress={() => setActiveMeal(type)}
              style={({ pressed }) => [styles.mealStop, { opacity: pressed ? 0.72 : 1 }]}
            >
              <View
                style={[
                  styles.mealIcon,
                  {
                    backgroundColor: active ? theme.accent : theme.surfaceRaised,
                    borderColor: active ? theme.accentStrong : theme.border,
                    shadowColor: active ? theme.accent : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={MEAL_ICONS[type]}
                  size={22}
                  color={active ? theme.accentOn : theme.textMuted}
                />
              </View>
              <AppText
                variant="caption"
                style={{
                  color: active ? theme.accentStrong : theme.textMuted,
                  textAlign: 'center',
                }}
              >
                {t(`journal.${type}`)}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.activeSurface,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: theme.shadow.color,
          },
        ]}
      >
        <View style={styles.surfaceHeader}>
          <View style={styles.grow}>
            <AppText variant="label" style={{ color: theme.accentStrong }}>
              {t(`journal.${activeMeal}`)}
            </AppText>
            <AppText variant="title">
              {activeEntries.length
                ? `${Math.round(activeTotals.calories)} ${t('common.kcal')}`
                : t('journal.emptyMeal')}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('journal.addFood')} ${t(`journal.${activeMeal}`)}`}
            onPress={() =>
              router.push({
                pathname: '/add-food',
                params: { mealType: activeMeal, localDate: today },
              })
            }
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.accent, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Ionicons name="add" size={25} color={theme.accentOn} />
          </Pressable>
        </View>
        {activeEntries.length ? (
          <View style={styles.macroRibbon}>
            {[
              activeTotals.calories,
              activeTotals.proteinG,
              activeTotals.carbsG,
              activeTotals.fatG,
            ].map((value, index) => (
              <View
                key={index}
                style={[
                  styles.macroMetric,
                  { borderRightColor: index === 3 ? 'transparent' : theme.border },
                ]}
              >
                <View
                  style={[
                    styles.macroMiniDot,
                    { backgroundColor: theme[MACRO_COLORS[index] ?? 'cyan'] },
                  ]}
                />
                <AppText variant="caption" style={{ color: theme.textSubtle }}>
                  {index === 0
                    ? t('home.calories')
                    : t(`home.${['protein', 'carbs', 'fat'][index - 1]}`)}
                </AppText>
                <AppText variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
                  {Math.round(value)}
                  {index === 0 ? '' : ' g'}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
        {activeEntries.length ? (
          <View>
            {activeEntries.map((entry) => {
              const values = scaleNutrition(entry.snapshot, entry.quantity);
              return (
                <Pressable
                  key={entry.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.snapshot.foodName}, ${entryAmount(entry)}, ${Math.round(values.calories)} kcal`}
                  onPress={() => openEntry(entry)}
                  style={({ pressed }) => [
                    styles.foodRow,
                    { borderBottomColor: theme.border, opacity: pressed ? 0.66 : 1 },
                  ]}
                >
                  <View style={[styles.foodGlyph, { backgroundColor: theme.surfaceMuted }]}>
                    <Ionicons name="nutrition-outline" size={19} color={theme.accentStrong} />
                  </View>
                  <View style={styles.grow}>
                    <AppText variant="subtitle">{entry.snapshot.foodName}</AppText>
                    <AppText variant="caption" style={{ color: theme.textSubtle }}>
                      {entryAmount(entry)}
                    </AppText>
                  </View>
                  <View style={styles.calorieCell}>
                    <AppText variant="subtitle" style={{ fontVariant: ['tabular-nums'] }}>
                      {Math.round(values.calories)}
                    </AppText>
                    <AppText variant="caption" style={{ color: theme.textSubtle }}>
                      {t('common.kcal')}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/add-food',
                params: { mealType: activeMeal, localDate: today },
              })
            }
            style={[styles.emptyAction, { borderColor: theme.border }]}
          >
            <Ionicons name="add-circle-outline" size={22} color={theme.accentStrong} />
            <View>
              <AppText variant="subtitle">{t('journal.addFood')}</AppText>
              <AppText variant="caption" style={{ color: theme.textMuted }}>
                {t('journal.emptyMeal')}
              </AppText>
            </View>
          </Pressable>
        )}
        <View style={styles.contextActions}>
          {duplicable.includes(activeMeal) ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void service.duplicateYesterday(activeMeal, today).then(load)}
              style={styles.contextAction}
            >
              <Ionicons name="copy-outline" size={16} color={theme.accentStrong} />
              <AppText variant="caption" style={{ color: theme.accentStrong }}>
                {t('journal.duplicateYesterday')}
              </AppText>
            </Pressable>
          ) : null}
          {activeEntries.length ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSavingMeal(true);
                setMealName('');
              }}
              style={styles.contextAction}
            >
              <Ionicons name="bookmark-outline" size={16} color={theme.accentStrong} />
              <AppText variant="caption" style={{ color: theme.accentStrong }}>
                {t('journal.saveMeal')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
        {savingMeal ? (
          <View style={styles.saveArea}>
            <Field
              label={t('journal.mealName')}
              value={mealName}
              onChangeText={setMealName}
              autoFocus
            />
            <Button
              label={t('journal.saveMeal')}
              disabled={!mealName.trim()}
              onPress={() =>
                void service
                  .saveMealTemplate({ name: mealName, localDate: today, mealType: activeMeal })
                  .then(() => {
                    setSavingMeal(false);
                    setMealName('');
                    load();
                  })
              }
            />
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/add-food',
              params: { mealType: activeMeal, localDate: today },
            })
          }
          style={({ pressed }) => [
            styles.addOutline,
            { borderColor: theme.accent, opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <Ionicons name="add" size={20} color={theme.accentStrong} />
          <AppText variant="subtitle" style={{ color: theme.accentStrong }}>
            {t('journal.addFood')}
          </AppText>
        </Pressable>
      </View>

      {templates.length ? (
        <View style={styles.templates}>
          <View style={styles.templateHeader}>
            <AppText variant="label" style={{ color: theme.textMuted }}>
              {t('journal.savedMeals')}
            </AppText>
            <ChoiceRow
              value={templateMeal}
              onChange={setTemplateMeal}
              options={MEALS.map((value) => ({ value, label: t(`journal.${value}`) }))}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateRail}
          >
            {templates.map((template) => (
              <Pressable
                key={template.id}
                accessibilityRole="button"
                onPress={() => void service.logMealTemplate(template, templateMeal).then(load)}
                style={({ pressed }) => [
                  styles.templateChip,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceRaised,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="flash-outline" size={17} color={theme.accentStrong} />
                <AppText variant="caption">{template.name}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View
        style={[styles.dayFooter, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View>
          <AppText variant="caption" style={{ color: theme.textSubtle }}>
            {t('home.todaySnapshot')}
          </AppText>
          <AppText variant="title">
            {Math.round(dayTotals.calories)} / {t('home.targetLabel')}
          </AppText>
        </View>
        <View style={[styles.totalPill, { backgroundColor: theme.accentSoft }]}>
          <AppText variant="subtitle" style={{ color: theme.accentInk }}>
            {Math.round(dayTotals.calories)} {t('common.kcal')}
          </AppText>
        </View>
      </View>

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
  header: { gap: 2, paddingTop: 10 },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  energyReadout: { alignItems: 'flex-end', paddingBottom: 4 },
  undoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  mealRailScroll: { flexGrow: 0, flexShrink: 0, height: 104 },
  mealRail: { gap: 13, paddingHorizontal: 2, paddingVertical: 4, alignItems: 'flex-start' },
  mealStop: {
    width: 66,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
  },
  mealIcon: {
    width: 52,
    height: 52,
    minHeight: 52,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.65,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  activeSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 15,
    gap: 13,
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  surfaceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, gap: 2 },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroRibbon: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000000',
    paddingVertical: 10,
  },
  macroMetric: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingHorizontal: 5,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  macroMiniDot: { width: 5, height: 5, borderRadius: 3 },
  foodRow: {
    minHeight: 63,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  foodGlyph: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieCell: { alignItems: 'flex-end', gap: 1 },
  emptyAction: {
    minHeight: 82,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
  },
  contextActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 },
  contextAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveArea: { gap: 8 },
  addOutline: {
    minHeight: 48,
    borderWidth: 1.3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  templates: { gap: 8 },
  templateHeader: { gap: 8 },
  templateRail: { gap: 8 },
  templateChip: {
    minHeight: 42,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 21,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayFooter: {
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  totalPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2,3,12,0.72)',
    padding: 12,
  },
  editor: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 18, gap: 12 },
});
