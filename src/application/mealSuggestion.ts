import type { MealType } from '@/domain/types';

/** UX policy only. It does not alter the nutrition domain or stored food data. */
export function suggestMealType(hour: number): MealType {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 19) return 'snack';
  if (hour >= 19 || hour < 5) return 'dinner';
  return 'other';
}
