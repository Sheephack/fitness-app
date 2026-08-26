import type { FoodLogEntry, NutritionValues } from './types';

export const EMPTY_NUTRITION: NutritionValues = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  sodiumMg: null,
};

export function scaleNutrition(values: NutritionValues, quantity: number): NutritionValues {
  return {
    calories: values.calories * quantity,
    proteinG: values.proteinG * quantity,
    carbsG: values.carbsG * quantity,
    fatG: values.fatG * quantity,
    fiberG: values.fiberG * quantity,
    sodiumMg: values.sodiumMg === null ? null : values.sodiumMg * quantity,
  };
}

export function totalNutrition(entries: FoodLogEntry[]): NutritionValues {
  return entries.reduce<NutritionValues>((total, entry) => {
    const scaled = scaleNutrition(entry.snapshot, entry.quantity);
    return {
      calories: total.calories + scaled.calories,
      proteinG: total.proteinG + scaled.proteinG,
      carbsG: total.carbsG + scaled.carbsG,
      fatG: total.fatG + scaled.fatG,
      fiberG: total.fiberG + scaled.fiberG,
      sodiumMg:
        total.sodiumMg === null && scaled.sodiumMg === null
          ? null
          : (total.sodiumMg ?? 0) + (scaled.sodiumMg ?? 0),
    };
  }, EMPTY_NUTRITION);
}

export function normalizeFoodSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .trim()
    .replace(/\s+/g, ' ');
}
