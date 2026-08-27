import { parseDecimalInput } from './numericInput';
import { ALL_NUTRIENTS_KNOWN, resolveLogQuantity, scaleNutrition } from './nutrition';

describe('numeric input and nutrition quantities', () => {
  test('accepts comma and period decimals and rejects impossible values', () => {
    expect(parseDecimalInput('1,5')).toBe(1.5);
    expect(parseDecimalInput('1.5')).toBe(1.5);
    expect(parseDecimalInput('NaN')).toBeNull();
    expect(parseDecimalInput('-2')).toBe(-2);
  });

  test('scales nutrition by grams and servings', () => {
    const values = {
      calories: 250,
      proteinG: 20,
      carbsG: 30,
      fatG: 10,
      fiberG: 5,
      sodiumMg: 100,
    };
    const serving = { grams: 100, ...values } as never;
    expect(resolveLogQuantity(serving, { kind: 'grams', grams: 40 })).toMatchObject({
      multiplier: 0.4,
      grams: 40,
      values: { calories: 100 },
    });
    expect(resolveLogQuantity(serving, { kind: 'servings', count: 1.5 })).toMatchObject({
      multiplier: 1.5,
      grams: 150,
    });
    expect(scaleNutrition(values, 0.4)).toMatchObject({ calories: 100, proteinG: 8 });
    expect(ALL_NUTRIENTS_KNOWN.calories).toBe(true);
  });
});
