import type {
  FoodLogEntry,
  FoodServing,
  LogQuantity,
  NutrientKey,
  NutritionAvailability,
  NutritionValues,
} from './types';

export const NUTRIENT_KEYS: NutrientKey[] = [
  'calories',
  'proteinG',
  'carbsG',
  'fatG',
  'fiberG',
  'sodiumMg',
];

export const ALL_NUTRIENTS_KNOWN: NutritionAvailability = {
  calories: true,
  proteinG: true,
  carbsG: true,
  fatG: true,
  fiberG: true,
  sodiumMg: true,
};

export interface NutritionSummary {
  values: NutritionValues;
  complete: NutritionAvailability;
}

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

export function nutritionAvailabilityToMask(availability: NutritionAvailability): number {
  return NUTRIENT_KEYS.reduce((mask, key, index) => mask | (availability[key] ? 1 << index : 0), 0);
}

export function nutritionAvailabilityFromMask(mask: number): NutritionAvailability {
  return Object.fromEntries(
    NUTRIENT_KEYS.map((key, index) => [key, (mask & (1 << index)) !== 0]),
  ) as unknown as NutritionAvailability;
}

export function resolveLogQuantity(
  serving: FoodServing,
  input: LogQuantity,
): {
  multiplier: number;
  grams: number | null;
  milliliters: number | null;
  values: NutritionValues;
} | null {
  const amount =
    input.kind === 'servings'
      ? input.count
      : input.kind === 'grams'
        ? input.grams
        : input.milliliters;
  const basisAmount = serving.nutritionBasisAmount ?? serving.grams;
  const basisUnit = serving.nutritionBasisUnit ?? 'g';
  if (!Number.isFinite(amount) || amount <= 0 || basisAmount <= 0) return null;
  const compatible =
    input.kind === 'servings' ||
    (input.kind === 'grams' && basisUnit === 'g') ||
    (input.kind === 'milliliters' && basisUnit === 'ml');
  if (!compatible) return null;
  const multiplier = input.kind === 'servings' ? input.count : amount / basisAmount;
  return {
    multiplier,
    grams: input.kind === 'milliliters' ? null : serving.grams * multiplier,
    milliliters: input.kind === 'milliliters' ? amount : null,
    values: scaleNutrition(serving, multiplier),
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

export function summarizeNutrition(entries: FoodLogEntry[]): NutritionSummary {
  return {
    values: totalNutrition(entries),
    complete: Object.fromEntries(
      NUTRIENT_KEYS.map((key) => [
        key,
        entries.every((entry) => entry.snapshot.knownNutrients[key]),
      ]),
    ) as unknown as NutritionAvailability,
  };
}

export function normalizeFoodSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .trim()
    .replace(/\s+/g, ' ');
}
