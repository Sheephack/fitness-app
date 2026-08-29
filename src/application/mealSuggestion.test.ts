import { suggestMealType } from './mealSuggestion';

test('suggests meals by time as a UI policy', () => {
  expect(suggestMealType(8)).toBe('breakfast');
  expect(suggestMealType(13)).toBe('lunch');
  expect(suggestMealType(17)).toBe('snack');
  expect(suggestMealType(22)).toBe('dinner');
});
