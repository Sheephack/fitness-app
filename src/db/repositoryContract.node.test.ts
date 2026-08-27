import type { SQLiteDatabase } from 'expo-sqlite';
import { FitnessService } from '@/application/FitnessService';
import type { Clock } from '@/application/ports';
import { createMemoryAppServices, DeterministicIdGenerator } from './memoryRepositories';
import { migrateDatabase } from './migrations';
import { createSqliteRepositories } from './sqliteRepositories';
import { parseLocalDate } from '@/domain/localDate';
import { normalizeBarcode } from '@/domain/barcode';
import type { Settings } from '@/domain/types';

type NodeStatement = {
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
  run(...params: unknown[]): unknown;
};
type NodeSqlite = {
  exec(sql: string): void;
  prepare(sql: string): NodeStatement;
  close(): void;
};

function nodeAdapter(database: NodeSqlite): SQLiteDatabase {
  return {
    execAsync: async (sql: string) => database.exec(sql),
    getFirstAsync: async <T>(sql: string, ...params: unknown[]) =>
      (database.prepare(sql).get(...params) as T | undefined) ?? null,
    getAllAsync: async <T>(sql: string, ...params: unknown[]) =>
      database.prepare(sql).all(...params) as T[],
    runAsync: async (sql: string, ...params: unknown[]) => database.prepare(sql).run(...params),
    withTransactionAsync: async <T>(operation: () => Promise<T>) => {
      database.exec('BEGIN');
      try {
        const result = await operation();
        database.exec('COMMIT');
        return result;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  } as unknown as SQLiteDatabase;
}

function openDatabase(): NodeSqlite {
  // node:sqlite is bundled with the test runtime, not an application dependency.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (location: string) => NodeSqlite;
  };
  return new DatabaseSync(':memory:');
}

const settings: Settings = {
  language: 'es',
  locale: 'es-AR',
  unitSystem: 'metric',
  onboardingCompleted: true,
};
const clock: Clock = {
  now: () => ({ utc: '2026-08-26T12:00:00.000Z', localDate: parseLocalDate('2026-08-26') }),
};

async function exercise(service: FitnessService) {
  const barcode = normalizeBarcode('4006381333931')!;
  const first = await service.createFood({
    name: 'Árbol',
    brand: 'Marca',
    servingDescription: '100 g',
    servingGrams: 100,
    calories: 200,
    proteinG: 12,
    carbsG: 20,
    fatG: 8,
    fiberG: 4,
    sodiumMg: null,
    barcode,
  });
  const second = await service.createFood({
    name: 'Avena',
    brand: null,
    servingDescription: '50 g',
    servingGrams: 50,
    calories: 150,
    proteinG: 5,
    carbsG: 25,
    fatG: 3,
    fiberG: 3,
    sodiumMg: null,
  });
  await service.toggleFavorite(second);
  await service.logFoodQuantity(first, 'breakfast', { kind: 'grams', grams: 40 });
  const beforeArchive = await service.listFoodLog();
  await service.archiveFood(first.food.id);
  const replacement = await service.createFood({
    name: 'Árbol nuevo',
    brand: null,
    servingDescription: '100 g',
    servingGrams: 100,
    calories: 210,
    proteinG: 10,
    carbsG: 22,
    fatG: 9,
    fiberG: 4,
    sodiumMg: null,
    barcode,
  });
  return {
    results: await service.listFoods('a'),
    favorites: await service.listFavoriteFoods(),
    recent: await service.listRecentFoods(),
    originalBarcode: await service.getFood(first.food.id),
    replacementBarcode: replacement.food.barcodeKey,
    snapshot: beforeArchive[0]?.snapshot,
  };
}

describe('food repository contract', () => {
  test('SQLite and in-memory adapters agree on barcode, archive, ranking, and snapshots', async () => {
    const memory = createMemoryAppServices(settings, clock, new DeterministicIdGenerator());
    const database = openDatabase();
    const sqliteDb = nodeAdapter(database);
    await migrateDatabase(sqliteDb);
    const sqlite = new FitnessService(
      createSqliteRepositories(sqliteDb),
      new DeterministicIdGenerator(),
      clock,
    );
    await sqlite.initializeSettings(settings);

    const [memoryResult, sqliteResult] = await Promise.all([
      exercise(memory.service),
      exercise(sqlite),
    ]);

    expect(sqliteResult.results.map((food) => food.food.name)).toEqual(
      memoryResult.results.map((food) => food.food.name),
    );
    expect(sqliteResult.favorites.map((food) => food.food.name)).toEqual(['Avena']);
    expect(sqliteResult.recent.map((food) => food.food.name)).toEqual([]);
    expect(sqliteResult.originalBarcode?.food.archivedAtUtc).not.toBeNull();
    expect(sqliteResult.replacementBarcode).toBe('gtin:4006381333931');
    expect(sqliteResult.snapshot).toEqual(memoryResult.snapshot);
    database.close();
  });
});
