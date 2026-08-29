import { createMemoryFitnessService, DeterministicIdGenerator } from '@/db/memoryRepositories';
import { parseLocalDate } from '@/domain/localDate';
import { normalizeBarcode } from '@/domain/barcode';
import type { Clock } from './ports';
import type { Settings } from '@/domain/types';
import {
  USDA_FOUNDATION_CATALOG,
  USDA_FOUNDATION_CATALOG_KEY,
  USDA_FOUNDATION_CATALOG_VERSION,
} from '@/catalog/usdaFoundation';

const settings: Settings = {
  language: 'es',
  locale: 'es-AR',
  unitSystem: 'metric',
  onboardingCompleted: false,
};
const fixedClock: Clock = {
  now: () => ({ utc: '2026-08-25T12:00:00.000Z', localDate: parseLocalDate('2026-08-25') }),
};

describe('FitnessService repository contract', () => {
  test('editing a food does not mutate nutrition already logged', async () => {
    const service = createMemoryFitnessService(
      settings,
      fixedClock,
      new DeterministicIdGenerator(),
    );
    const food = await service.createFood({
      name: 'Hamburguesa',
      brand: null,
      servingDescription: '1 unidad',
      servingGrams: 200,
      calories: 520,
      proteinG: 30,
      carbsG: 40,
      fatG: 24,
      fiberG: 3,
      sodiumMg: null,
    });
    await service.logFood(food, 'lunch', 1);
    await service.updateFood(food.food.id, {
      name: 'Hamburguesa',
      brand: null,
      servingDescription: '1 unidad',
      servingGrams: 200,
      calories: 480,
      proteinG: 30,
      carbsG: 40,
      fatG: 20,
      fiberG: 3,
      sodiumMg: null,
    });
    const dashboard = await service.getDashboard(parseLocalDate('2026-08-25'));
    expect(dashboard.totals.calories).toBe(520);
  });

  test('stores and queries journal entries by explicit localDate', async () => {
    const service = createMemoryFitnessService(
      settings,
      fixedClock,
      new DeterministicIdGenerator(),
    );
    const food = await service.createFood({
      name: 'Yogur',
      brand: null,
      servingDescription: '1 pote',
      servingGrams: 190,
      calories: 120,
      proteinG: 10,
      carbsG: 14,
      fatG: 2,
      fiberG: 0,
      sodiumMg: null,
    });
    await service.logFood(food, 'breakfast', 1, parseLocalDate('2026-08-24'));
    expect(await service.listFoodLog(parseLocalDate('2026-08-24'))).toHaveLength(1);
    expect(await service.listFoodLog(parseLocalDate('2026-08-25'))).toHaveLength(0);
  });

  test('preserves imported unknown nutrients in the food-log snapshot', async () => {
    const service = createMemoryFitnessService(
      settings,
      fixedClock,
      new DeterministicIdGenerator(),
    );
    const barcode = normalizeBarcode('4006381333931')!;
    const food = await service.importExternalFood(
      {
        barcode,
        name: 'Imported product',
        brand: null,
        quantityDescription: null,
        servingDescription: '100 g',
        servingGrams: 100,
        basis: 'per_100g',
        nutrition: { calories: 250, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sodiumMg: null },
        knownNutrients: {
          calories: true,
          proteinG: false,
          carbsG: false,
          fatG: false,
          fiberG: false,
          sodiumMg: false,
        },
        externalId: barcode.value,
        sourceUpdatedAtUtc: null,
      },
      {
        name: 'Imported product',
        brand: null,
        servingDescription: '100 g',
        servingGrams: 100,
        calories: 250,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        sodiumMg: null,
        knownNutrients: {
          calories: true,
          proteinG: false,
          carbsG: false,
          fatG: false,
          fiberG: false,
          sodiumMg: false,
        },
      },
      false,
    );
    await service.logFoodQuantity(food, 'lunch', { kind: 'grams', grams: 40 });
    const [entry] = await service.listFoodLog();
    if (!entry) throw new Error('Expected a food log entry');
    expect(entry.snapshot.calories).toBe(250);
    expect(entry.snapshot.knownNutrients).toMatchObject({ calories: true, proteinG: false });
    const dashboard = await service.getDashboard();
    expect(dashboard.nutritionComplete.proteinG).toBe(false);
    expect(dashboard.balance).toBeNull();
  });

  test('seeds USDA nutrition once, searches editorial aliases offline, and persists preferences', async () => {
    const service = createMemoryFitnessService(
      settings,
      fixedClock,
      new DeterministicIdGenerator(),
    );
    await service.seedCatalog(
      USDA_FOUNDATION_CATALOG_KEY,
      USDA_FOUNDATION_CATALOG_VERSION,
      USDA_FOUNDATION_CATALOG,
    );
    await service.seedCatalog(
      USDA_FOUNDATION_CATALOG_KEY,
      USDA_FOUNDATION_CATALOG_VERSION,
      USDA_FOUNDATION_CATALOG,
    );
    const foods = await service.listFoods('pechuga');
    expect(foods).toHaveLength(2);
    expect(foods[0]?.food.externalId).toBe('usda:2646170');
    expect(foods[0]?.serving.calories).toBe(106);
    await service.setLoggingPreferences({ quickMenuSide: 'left', dashboardVisualization: 'bars' });
    expect(await service.getLoggingPreferences()).toEqual({
      quickMenuSide: 'left',
      dashboardVisualization: 'bars',
    });
  });

  test('remembers the latest food quantity and edits a log entry safely', async () => {
    const service = createMemoryFitnessService(
      settings,
      fixedClock,
      new DeterministicIdGenerator(),
    );
    const food = await service.createFood({
      name: 'Avena',
      brand: null,
      servingDescription: '100 g',
      servingGrams: 100,
      calories: 370,
      proteinG: 13,
      carbsG: 60,
      fatG: 7,
      fiberG: 10,
      sodiumMg: null,
    });
    const entry = await service.logFoodQuantity(food, 'breakfast', { kind: 'grams', grams: 60 });
    expect(await service.getLastFoodQuantity(food.food.id)).toMatchObject({
      amount: 60,
      unit: 'grams',
    });
    const updated = await service.updateFoodLogEntry(entry.id, parseLocalDate('2026-08-25'), {
      mealType: 'snack',
      amount: 40,
      unit: 'grams',
    });
    expect(updated).toMatchObject({ mealType: 'snack', quantityAmount: 40, quantity: 0.4 });
  });
});
