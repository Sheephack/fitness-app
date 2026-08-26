import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (currentVersion < 1) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          language TEXT NOT NULL CHECK (language IN ('es', 'en')),
          locale TEXT NOT NULL,
          unit_system TEXT NOT NULL CHECK (unit_system IN ('metric', 'imperial')),
          onboarding_completed INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          nickname TEXT NOT NULL,
          birth_date TEXT NOT NULL,
          height_cm REAL NOT NULL CHECK (height_cm > 0),
          target_weight_kg REAL NOT NULL CHECK (target_weight_kg > 0),
          activity_level TEXT NOT NULL,
          goal_type TEXT NOT NULL,
          target_pace_kg_week REAL,
          created_at_utc TEXT NOT NULL,
          updated_at_utc TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS body_measurements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          kind TEXT NOT NULL CHECK (kind = 'height_cm'),
          value REAL NOT NULL CHECK (value > 0),
          measured_at_utc TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS weight_entries (
          id TEXT PRIMARY KEY,
          weight_kg REAL NOT NULL CHECK (weight_kg > 0),
          measured_at_utc TEXT NOT NULL,
          local_date TEXT NOT NULL,
          note TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_weight_local_date ON weight_entries(local_date DESC);

        CREATE TABLE IF NOT EXISTS nutrition_goals (
          id TEXT PRIMARY KEY,
          calories_target REAL NOT NULL CHECK (calories_target > 0),
          protein_min REAL NOT NULL, protein_max REAL NOT NULL,
          carbs_min REAL NOT NULL, carbs_max REAL NOT NULL,
          fat_min REAL NOT NULL, fat_max REAL NOT NULL,
          fiber_min REAL NOT NULL, fiber_max REAL NOT NULL,
          effective_from TEXT NOT NULL,
          created_at_utc TEXT NOT NULL,
          updated_at_utc TEXT NOT NULL,
          CHECK (protein_min <= protein_max),
          CHECK (carbs_min <= carbs_max),
          CHECK (fat_min <= fat_max),
          CHECK (fiber_min <= fiber_max)
        );

        CREATE TABLE IF NOT EXISTS foods (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          normalized_name TEXT NOT NULL,
          brand TEXT,
          is_favorite INTEGER NOT NULL DEFAULT 0,
          source TEXT NOT NULL CHECK (source IN ('custom', 'seed')),
          archived_at_utc TEXT,
          created_at_utc TEXT NOT NULL,
          updated_at_utc TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_foods_search ON foods(normalized_name);

        CREATE TABLE IF NOT EXISTS food_servings (
          id TEXT PRIMARY KEY,
          food_id TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          grams REAL NOT NULL CHECK (grams > 0),
          calories REAL NOT NULL CHECK (calories >= 0),
          protein_g REAL NOT NULL CHECK (protein_g >= 0),
          carbs_g REAL NOT NULL CHECK (carbs_g >= 0),
          fat_g REAL NOT NULL CHECK (fat_g >= 0),
          fiber_g REAL NOT NULL CHECK (fiber_g >= 0),
          sodium_mg REAL CHECK (sodium_mg IS NULL OR sodium_mg >= 0)
        );

        CREATE TABLE IF NOT EXISTS food_log_entries (
          id TEXT PRIMARY KEY,
          local_date TEXT NOT NULL,
          meal_type TEXT NOT NULL,
          food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
          serving_id TEXT REFERENCES food_servings(id) ON DELETE SET NULL,
          quantity REAL NOT NULL CHECK (quantity > 0),
          snapshot_food_name TEXT NOT NULL,
          snapshot_brand TEXT,
          snapshot_serving_description TEXT NOT NULL,
          snapshot_serving_grams REAL NOT NULL,
          snapshot_calories REAL NOT NULL,
          snapshot_protein_g REAL NOT NULL,
          snapshot_carbs_g REAL NOT NULL,
          snapshot_fat_g REAL NOT NULL,
          snapshot_fiber_g REAL NOT NULL,
          snapshot_sodium_mg REAL,
          logged_at_utc TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_log_local_date ON food_log_entries(local_date, meal_type);

        CREATE TABLE IF NOT EXISTS meal_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at_utc TEXT NOT NULL,
          updated_at_utc TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS meal_template_items (
          id TEXT PRIMARY KEY,
          template_id TEXT NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
          food_id TEXT NOT NULL REFERENCES foods(id),
          serving_id TEXT NOT NULL REFERENCES food_servings(id),
          quantity REAL NOT NULL CHECK (quantity > 0),
          sort_order INTEGER NOT NULL
        );
      `);
    }
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}

export function plannedMigrationVersions(currentVersion: number): number[] {
  return currentVersion < 1 ? [1] : [];
}
