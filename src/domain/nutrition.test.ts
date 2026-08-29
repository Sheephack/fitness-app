import { ALL_NUTRIENTS_KNOWN, totalNutrition } from './nutrition';
import { parseLocalDate } from './localDate';
import type { FoodLogEntry } from './types';

describe('nutrition snapshots', () => {
  test('totals the immutable snapshot and quantity', () => {
    const entry: FoodLogEntry = {
      id: 'entry',
      localDate: parseLocalDate('2026-08-25'),
      mealType: 'lunch',
      foodId: 'food',
      servingId: 'serving',
      quantity: 1.5,
      quantityAmount: 1.5,
      quantityUnit: 'servings',
      loggedAtUtc: '2026-08-25T15:00:00.000Z',
      snapshot: {
        foodName: 'Hamburguesa',
        brand: null,
        servingDescription: '1 unidad',
        servingGrams: 200,
        nutritionBasisAmount: 200,
        nutritionBasisUnit: 'g',
        knownNutrients: ALL_NUTRIENTS_KNOWN,
        calories: 520,
        proteinG: 30,
        carbsG: 40,
        fatG: 24,
        fiberG: 3,
        sodiumMg: 700,
      },
    };
    const total = totalNutrition([entry]);
    expect(total.calories).toBe(780);
    expect(total.proteinG).toBe(45);
    expect(total.sodiumMg).toBe(1050);
  });
});
