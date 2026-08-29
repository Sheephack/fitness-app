import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Button, ChoiceRow, Field, Screen } from '@/components/ui';
import { suggestMealType } from '@/application/mealSuggestion';
import { parseDecimalInput } from '@/domain/numericInput';
import type { MealType, NutritionAvailability, NutritionValues } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';

const MEALS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function QuickAddScreen() {
  const { t } = useTranslation();
  const { service } = useFitnessService();
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>(suggestMealType(new Date().getHours()));
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    const calorieValue = parseDecimalInput(calories);
    if (calorieValue === null || calorieValue < 0) return;
    const optional = (value: string) => parseDecimalInput(value);
    const proteinValue = optional(protein);
    const carbsValue = optional(carbs);
    const fatValue = optional(fat);
    const nutrition: NutritionValues = {
      calories: calorieValue,
      proteinG: proteinValue ?? 0,
      carbsG: carbsValue ?? 0,
      fatG: fatValue ?? 0,
      fiberG: 0,
      sodiumMg: null,
    };
    const knownNutrients: NutritionAvailability = {
      calories: true,
      proteinG: proteinValue !== null,
      carbsG: carbsValue !== null,
      fatG: fatValue !== null,
      fiberG: false,
      sodiumMg: false,
    };
    setSaving(true);
    try {
      await service.logQuickAdd({
        name: name.trim() || t('quickAdd.title'),
        mealType,
        nutrition,
        knownNutrients,
      });
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen>
      <AppText variant="display">{t('quickAdd.title')}</AppText>
      <AppText muted>{t('quickAdd.body')}</AppText>
      <ChoiceRow
        value={mealType}
        onChange={setMealType}
        options={MEALS.map((value) => ({ value, label: t('journal.' + value) }))}
      />
      <Field label={t('quickAdd.name')} value={name} onChangeText={setName} />
      <Field
        label={t('food.calories')}
        value={calories}
        onChangeText={setCalories}
        keyboardType="decimal-pad"
      />
      <Field
        label={t('food.protein')}
        value={protein}
        onChangeText={setProtein}
        keyboardType="decimal-pad"
      />
      <Field
        label={t('food.carbs')}
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="decimal-pad"
      />
      <Field label={t('food.fat')} value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
      <Button
        label={t('quickAdd.confirm')}
        onPress={() => void submit()}
        loading={saving}
        disabled={parseDecimalInput(calories) === null}
      />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
