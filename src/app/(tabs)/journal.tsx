import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, ChoiceRow, Field, Screen, SectionHeader } from '@/components/ui';
import { localDateFromDate } from '@/domain/localDate';
import { scaleNutrition } from '@/domain/nutrition';
import type { FoodLogEntry, FoodWithServing, MealTemplate, MealType } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';
import { useAppTheme } from '@/theme/theme';

const MEALS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];

export default function JournalScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { service } = useFitnessService();
  const today = localDateFromDate(new Date());
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<FoodWithServing[]>([]);
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [selected, setSelected] = useState<FoodWithServing | null>(null);
  const [meal, setMeal] = useState<MealType>('breakfast');
  const [quantity, setQuantity] = useState('1');
  const [mealName, setMealName] = useState('');
  const load = useCallback(() => {
    Promise.all([
      service.listFoods(query),
      service.listFoodLog(today),
      service.listMealTemplates(),
    ]).then(([foodList, log, mealTemplates]) => {
      setFoods(foodList);
      setEntries(log);
      setTemplates(mealTemplates);
    });
  }, [query, service, today]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const groups = useMemo(
    () =>
      Object.fromEntries(
        MEALS.map((type) => [type, entries.filter((entry) => entry.mealType === type)]),
      ) as Record<MealType, FoodLogEntry[]>,
    [entries],
  );
  const logSelected = async () => {
    if (!selected || Number(quantity) <= 0) return;
    await service.logFood(selected, meal, Number(quantity), today);
    setSelected(null);
    setQuantity('1');
    load();
  };
  const duplicate = async (type: MealType) => {
    const count = await service.duplicateYesterday(type, today);
    Alert.alert(count ? t('journal.duplicated', { count }) : t('journal.nothingToDuplicate'));
    load();
  };
  const saveMeal = async () => {
    if (!mealName.trim()) return;
    try {
      await service.saveMealTemplate({ name: mealName, localDate: today, mealType: meal });
      setMealName('');
      load();
    } catch {
      Alert.alert(t('journal.emptyMeal'));
    }
  };
  const archive = (food: FoodWithServing) =>
    Alert.alert(t('food.archiveTitle'), t('food.archiveBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void service.archiveFood(food.food.id).then(load);
        },
      },
    ]);
  return (
    <Screen>
      <AppText variant="display">{t('journal.title')}</AppText>
      <AppText muted>{t('journal.subtitle', { date: today })}</AppText>
      <Field label={t('journal.search')} value={query} onChangeText={setQuery} />
      <Button label={`+ ${t('journal.createFood')}`} onPress={() => router.push('/food-form')} />
      <SectionHeader title={t('journal.allFoods')} />
      {foods.length === 0 ? (
        <Card>
          <AppText muted>{t('journal.emptyFoods')}</AppText>
        </Card>
      ) : (
        foods.map((item) => (
          <Card key={item.food.id}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelected(item)}
              style={styles.foodRow}
            >
              <View style={styles.grow}>
                <AppText variant="subtitle">{item.food.name}</AppText>
                <AppText variant="caption" muted>
                  {item.food.brand ? `${item.food.brand} · ` : ''}
                  {item.serving.description} · {Math.round(item.serving.calories)} kcal
                </AppText>
              </View>
              <AppText>{item.food.isFavorite ? '★' : '☆'}</AppText>
            </Pressable>
            <View style={styles.smallActions}>
              <Button
                label={item.food.isFavorite ? '★' : '☆'}
                variant="ghost"
                onPress={() => {
                  void service.toggleFavorite(item).then(load);
                }}
              />
              <Button
                label={t('common.edit')}
                variant="ghost"
                onPress={() =>
                  router.push({ pathname: '/food-form', params: { id: item.food.id } })
                }
              />
              <Button label={t('common.delete')} variant="ghost" onPress={() => archive(item)} />
            </View>
          </Card>
        ))
      )}
      {MEALS.map((type) => (
        <View key={type} style={styles.section}>
          <SectionHeader title={t(`journal.${type}`)} />
          <Card>
            {(groups[type] ?? []).length === 0 ? (
              <AppText muted>{t('journal.emptyMeal')}</AppText>
            ) : (
              (groups[type] ?? []).map((entry) => {
                const values = scaleNutrition(entry.snapshot, entry.quantity);
                return (
                  <View key={entry.id} style={[styles.logRow, { borderBottomColor: theme.border }]}>
                    <View style={styles.grow}>
                      <AppText>{entry.snapshot.foodName}</AppText>
                      <AppText variant="caption" muted>
                        {entry.quantity} × {entry.snapshot.servingDescription} ·{' '}
                        {Math.round(values.calories)} kcal
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('common.delete')}
                      onPress={() => {
                        void service.removeFoodLogEntry(entry.id).then(load);
                      }}
                    >
                      <AppText style={{ color: theme.danger }}>×</AppText>
                    </Pressable>
                  </View>
                );
              })
            )}
            <View style={styles.stack}>
              <Button
                label={t('journal.duplicateYesterday')}
                variant="secondary"
                onPress={() => void duplicate(type)}
              />
              <Button label={t('journal.saveMeal')} variant="ghost" onPress={() => setMeal(type)} />
            </View>
          </Card>
        </View>
      ))}
      <SectionHeader title={t('journal.savedMeals')} />
      <Card>
        <Field label={t('journal.mealName')} value={mealName} onChangeText={setMealName} />
        <ChoiceRow
          value={meal}
          onChange={setMeal}
          options={MEALS.map((value) => ({ value, label: t(`journal.${value}`) }))}
        />
        <Button
          label={t('journal.saveMeal')}
          onPress={() => void saveMeal()}
          disabled={!mealName.trim()}
        />
      </Card>
      {templates.map((template) => (
        <Card key={template.id}>
          <AppText variant="subtitle">{template.name}</AppText>
          <AppText muted>{t('journal.itemCount', { count: template.items.length })}</AppText>
          <Button
            label={t('journal.logMeal')}
            variant="secondary"
            onPress={() => {
              void service.logMealTemplate(template, meal).then(load);
            }}
          />
        </Card>
      ))}
      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <AppText variant="title">{selected?.food.name}</AppText>
            <Field
              label={t('journal.quantity')}
              keyboardType="decimal-pad"
              value={quantity}
              onChangeText={setQuantity}
            />
            <AppText variant="label">{t('journal.meal')}</AppText>
            <ChoiceRow
              value={meal}
              onChange={setMeal}
              options={MEALS.map((value) => ({ value, label: t(`journal.${value}`) }))}
            />
            <Button label={t('journal.addToJournal')} onPress={() => void logSelected()} />
            <Button label={t('common.cancel')} variant="ghost" onPress={() => setSelected(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  foodRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 10 },
  grow: { flex: 1 },
  smallActions: { flexDirection: 'row', gap: 6 },
  section: { gap: 8 },
  logRow: {
    minHeight: 48,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stack: { gap: 8, marginTop: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    gap: 16,
    maxHeight: '85%',
  },
});
