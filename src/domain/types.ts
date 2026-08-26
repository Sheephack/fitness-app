export type UUID = string;

declare const localDateBrand: unique symbol;
export type LocalDate = string & { readonly [localDateBrand]: true };

export type SupportedLanguage = 'es' | 'en';
export type UnitSystem = 'metric' | 'imperial';
export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'other';

export interface Settings {
  language: SupportedLanguage;
  locale: string;
  unitSystem: UnitSystem;
  onboardingCompleted: boolean;
}

export interface Profile {
  id: UUID;
  nickname: string;
  birthDate: LocalDate;
  heightCm: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  targetPaceKgPerWeek: number | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface WeightEntry {
  id: UUID;
  weightKg: number;
  measuredAtUtc: string;
  localDate: LocalDate;
  note: string | null;
}

export interface NutrientRange {
  min: number;
  max: number;
}

export interface NutritionGoals {
  id: UUID;
  caloriesTarget: number;
  protein: NutrientRange;
  carbs: NutrientRange;
  fat: NutrientRange;
  fiber: NutrientRange;
  effectiveFrom: LocalDate;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface NutritionValues {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number | null;
}

export interface Food {
  id: UUID;
  name: string;
  normalizedName: string;
  brand: string | null;
  isFavorite: boolean;
  source: 'custom' | 'seed';
  archivedAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface FoodServing extends NutritionValues {
  id: UUID;
  foodId: UUID;
  description: string;
  grams: number;
}

export interface FoodWithServing {
  food: Food;
  serving: FoodServing;
}

export interface FoodLogSnapshot extends NutritionValues {
  foodName: string;
  brand: string | null;
  servingDescription: string;
  servingGrams: number;
}

export interface FoodLogEntry {
  id: UUID;
  localDate: LocalDate;
  mealType: MealType;
  foodId: UUID | null;
  servingId: UUID | null;
  quantity: number;
  snapshot: FoodLogSnapshot;
  loggedAtUtc: string;
}

export interface MealTemplateItem {
  id: UUID;
  foodId: UUID;
  servingId: UUID;
  quantity: number;
  sortOrder: number;
}

export interface MealTemplate {
  id: UUID;
  name: string;
  items: MealTemplateItem[];
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface FoodDraft extends NutritionValues {
  name: string;
  brand: string | null;
  servingDescription: string;
  servingGrams: number;
}

export interface ProfileDraft {
  nickname: string;
  birthDate: LocalDate;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  targetPaceKgPerWeek: number | null;
  unitSystem: UnitSystem;
}
