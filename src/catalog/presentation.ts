import type { FoodWithServing, SupportedLanguage } from '@/domain/types';
import { USDA_FOUNDATION_CATALOG } from './usdaFoundation';

const byExternalId = new Map<string, (typeof USDA_FOUNDATION_CATALOG)[number]['presentation']>(
  USDA_FOUNDATION_CATALOG.map((item) => [`usda:${item.fdcId}`, item.presentation] as const),
);

export function displayFoodName(food: FoodWithServing, language: SupportedLanguage): string {
  return byExternalId.get(food.food.externalId ?? '')?.[language] ?? food.food.name;
}
