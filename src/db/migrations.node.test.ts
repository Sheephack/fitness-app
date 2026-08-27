import type { SQLiteDatabase } from 'expo-sqlite';
import { migrateDatabase } from './migrations';

type NodeSqlite = {
  exec(sql: string): void;
  prepare(sql: string): {
    get(...params: unknown[]): Record<string, unknown> | undefined;
  };
  close(): void;
};

function nodeAdapter(database: NodeSqlite): SQLiteDatabase {
  return {
    execAsync: async (sql: string) => database.exec(sql),
    getFirstAsync: async <T>(sql: string) => database.prepare(sql).get() as T | null,
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
  // node:sqlite is bundled with the Node runtime used by this test, not an app dependency.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (location: string) => NodeSqlite;
  };
  return new DatabaseSync(':memory:');
}

describe('SQLite schema migrations', () => {
  test('migrates a v1 fixture to v2 without changing its history', async () => {
    const database = openDatabase();
    database.exec(`
      CREATE TABLE foods (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, normalized_name TEXT NOT NULL, brand TEXT,
        is_favorite INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL,
        archived_at_utc TEXT, created_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL
      );
      CREATE TABLE food_servings (
        id TEXT PRIMARY KEY, food_id TEXT NOT NULL, description TEXT NOT NULL, grams REAL NOT NULL,
        calories REAL NOT NULL, protein_g REAL NOT NULL, carbs_g REAL NOT NULL, fat_g REAL NOT NULL,
        fiber_g REAL NOT NULL, sodium_mg REAL
      );
      CREATE TABLE food_log_entries (
        id TEXT PRIMARY KEY, local_date TEXT NOT NULL, meal_type TEXT NOT NULL, food_id TEXT,
        serving_id TEXT, quantity REAL NOT NULL, snapshot_food_name TEXT NOT NULL,
        snapshot_brand TEXT, snapshot_serving_description TEXT NOT NULL,
        snapshot_serving_grams REAL NOT NULL, snapshot_calories REAL NOT NULL,
        snapshot_protein_g REAL NOT NULL, snapshot_carbs_g REAL NOT NULL,
        snapshot_fat_g REAL NOT NULL, snapshot_fiber_g REAL NOT NULL,
        snapshot_sodium_mg REAL, logged_at_utc TEXT NOT NULL
      );
      INSERT INTO foods VALUES ('food-1','Café','cafe','Marca',1,'custom',NULL,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
      INSERT INTO food_servings VALUES ('serving-1','food-1','100 g',100,20,1,2,3,4,5);
      INSERT INTO food_log_entries VALUES ('log-1','2026-01-02','breakfast','food-1','serving-1',1,'Café','Marca','100 g',100,20,1,2,3,4,5,'2026-01-02T08:00:00Z');
      PRAGMA user_version = 1;
    `);
    await migrateDatabase(nodeAdapter(database));
    expect(database.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 2 });
    expect(
      database.prepare("SELECT name, search_text, barcode_key FROM foods WHERE id='food-1'").get(),
    ).toEqual({
      name: 'Café',
      search_text: 'cafe marca',
      barcode_key: null,
    });
    expect(
      database
        .prepare(
          "SELECT snapshot_calories, snapshot_known_nutrients_mask FROM food_log_entries WHERE id='log-1'",
        )
        .get(),
    ).toEqual({ snapshot_calories: 20, snapshot_known_nutrients_mask: 63 });
    await migrateDatabase(nodeAdapter(database));
    expect(database.prepare('SELECT count(*) AS count FROM foods').get()).toEqual({ count: 1 });
    database.close();
  });

  test('runs empty installation through v1 and v2', async () => {
    const database = openDatabase();
    await migrateDatabase(nodeAdapter(database));
    expect(
      database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='foods'").get(),
    ).toEqual({ name: 'foods' });
    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_foods_active_barcode'",
        )
        .get(),
    ).toEqual({ name: 'idx_foods_active_barcode' });
    database.close();
  });
});
