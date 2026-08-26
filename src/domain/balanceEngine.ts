import type { NutrientRange, NutritionGoals, NutritionValues } from './types';

export const NEAR_UPPER_BOUND_RATIO = 0.85;

export type NutrientStatus = 'below_target' | 'within_target' | 'near_upper_limit' | 'above_target';

export type BalanceInsightCode =
  | 'low_protein'
  | 'low_fiber'
  | 'low_carbs'
  | 'fat_near_upper'
  | 'fat_above'
  | 'calories_above'
  | 'balanced';

export type NextMoveCode =
  | 'lean_protein_and_vegetables'
  | 'protein_and_fiber'
  | 'carbohydrate_friendly_meal'
  | 'balanced_meal'
  | 'gentle_finish';

export interface BalancePolicy {
  nearUpperBoundRatio: number;
}

export interface BalanceAssessment {
  statuses: {
    protein: NutrientStatus;
    carbs: NutrientStatus;
    fat: NutrientStatus;
    fiber: NutrientStatus;
  };
  insights: BalanceInsightCode[];
  nextMove: {
    code: NextMoveCode;
    proteinLowerG: number | null;
    proteinUpperG: number | null;
  };
  remainingCalories: number;
}

export const DEFAULT_BALANCE_POLICY: BalancePolicy = {
  nearUpperBoundRatio: NEAR_UPPER_BOUND_RATIO,
};

export function evaluateRange(
  consumed: number,
  range: NutrientRange,
  policy: BalancePolicy = DEFAULT_BALANCE_POLICY,
): NutrientStatus {
  if (consumed < range.min) return 'below_target';
  if (consumed > range.max) return 'above_target';
  if (consumed >= range.max * policy.nearUpperBoundRatio) return 'near_upper_limit';
  return 'within_target';
}

function proteinSuggestion(deficit: number): { lower: number | null; upper: number | null } {
  if (deficit < 10) return { lower: null, upper: null };
  const lower = Math.min(35, Math.max(10, Math.ceil((deficit - 5) / 5) * 5));
  return { lower, upper: Math.min(45, lower + 10) };
}

export function evaluateDailyBalance(
  consumed: NutritionValues,
  goals: NutritionGoals,
  policy: BalancePolicy = DEFAULT_BALANCE_POLICY,
): BalanceAssessment {
  const statuses = {
    protein: evaluateRange(consumed.proteinG, goals.protein, policy),
    carbs: evaluateRange(consumed.carbsG, goals.carbs, policy),
    fat: evaluateRange(consumed.fatG, goals.fat, policy),
    fiber: evaluateRange(consumed.fiberG, goals.fiber, policy),
  };
  const insights: BalanceInsightCode[] = [];
  if (statuses.protein === 'below_target') insights.push('low_protein');
  if (statuses.fiber === 'below_target') insights.push('low_fiber');
  if (statuses.carbs === 'below_target') insights.push('low_carbs');
  if (statuses.fat === 'near_upper_limit') insights.push('fat_near_upper');
  if (statuses.fat === 'above_target') insights.push('fat_above');
  if (consumed.calories > goals.caloriesTarget) insights.push('calories_above');
  if (insights.length === 0) insights.push('balanced');

  const proteinDeficit = Math.max(0, goals.protein.min - consumed.proteinG);
  const protein = proteinSuggestion(proteinDeficit);
  let code: NextMoveCode = 'balanced_meal';
  if (consumed.calories > goals.caloriesTarget) code = 'gentle_finish';
  else if (statuses.fat === 'near_upper_limit' || statuses.fat === 'above_target') {
    code = 'lean_protein_and_vegetables';
  } else if (statuses.protein === 'below_target' || statuses.fiber === 'below_target') {
    code = 'protein_and_fiber';
  } else if (statuses.carbs === 'below_target') code = 'carbohydrate_friendly_meal';

  return {
    statuses,
    insights,
    nextMove: {
      code,
      proteinLowerG: protein.lower,
      proteinUpperG: protein.upper,
    },
    remainingCalories: Math.max(0, goals.caloriesTarget - consumed.calories),
  };
}
