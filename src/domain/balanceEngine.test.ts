import { evaluateDailyBalance, evaluateRange, NEAR_UPPER_BOUND_RATIO } from './balanceEngine';
import { parseLocalDate } from './localDate';
import type { NutritionGoals, NutritionValues } from './types';

const goals: NutritionGoals = {
  id: 'goal',
  caloriesTarget: 2200,
  protein: { min: 120, max: 140 },
  carbs: { min: 180, max: 230 },
  fat: { min: 55, max: 70 },
  fiber: { min: 25, max: 35 },
  effectiveFrom: parseLocalDate('2026-08-25'),
  createdAtUtc: '2026-08-25T12:00:00.000Z',
  updatedAtUtc: '2026-08-25T12:00:00.000Z',
};

const consumed = (overrides: Partial<NutritionValues> = {}): NutritionValues => ({
  calories: 1500,
  proteinG: 130,
  carbsG: 200,
  fatG: 60,
  fiberG: 30,
  sodiumMg: null,
  ...overrides,
});

describe('Daily Balance Engine', () => {
  test('treats the near upper threshold as an injected policy boundary', () => {
    expect(NEAR_UPPER_BOUND_RATIO).toBe(0.85);
    expect(evaluateRange(59.5, goals.fat)).toBe('near_upper_limit');
    expect(evaluateRange(59.4, goals.fat)).toBe('within_target');
    expect(evaluateRange(63, goals.fat, { nearUpperBoundRatio: 0.9 })).toBe('near_upper_limit');
  });

  test('prioritizes lean protein when protein is low and fat is near its upper limit', () => {
    const result = evaluateDailyBalance(consumed({ proteinG: 80, fatG: 65 }), goals);
    expect(result.insights).toEqual(expect.arrayContaining(['low_protein', 'fat_near_upper']));
    expect(result.nextMove.code).toBe('lean_protein_and_vegetables');
    expect(result.nextMove.proteinLowerG).toBeGreaterThanOrEqual(10);
  });

  test('does not recommend compensatory behavior when calories are above target', () => {
    const result = evaluateDailyBalance(consumed({ calories: 2400 }), goals);
    expect(result.insights).toContain('calories_above');
    expect(result.nextMove.code).toBe('gentle_finish');
    expect(result.remainingCalories).toBe(0);
  });
});
