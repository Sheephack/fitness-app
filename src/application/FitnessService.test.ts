import { createMemoryFitnessService, DeterministicIdGenerator } from '@/db/memoryRepositories';
import { parseLocalDate } from '@/domain/localDate';
import type { Clock } from './ports';
import type { Settings } from '@/domain/types';

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
});
