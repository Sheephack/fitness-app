import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 4;

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
    if (currentVersion < 2) {
      await db.execAsync(`
        ALTER TABLE foods ADD COLUMN barcode TEXT;
        ALTER TABLE foods ADD COLUMN barcode_format TEXT
          CHECK (barcode_format IS NULL OR barcode_format IN ('ean13','ean8','upc_a','upc_e'));
        ALTER TABLE foods ADD COLUMN barcode_key TEXT;
        ALTER TABLE foods ADD COLUMN provider_id TEXT;
        ALTER TABLE foods ADD COLUMN external_id TEXT;
        ALTER TABLE foods ADD COLUMN source_updated_at_utc TEXT;
        ALTER TABLE foods ADD COLUMN imported_at_utc TEXT;
        ALTER TABLE foods ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'not_applicable'
          CHECK (verification_status IN ('not_applicable','reviewed','edited'));
        ALTER TABLE foods ADD COLUMN search_text TEXT NOT NULL DEFAULT '';
        UPDATE foods
          SET search_text = trim(normalized_name || ' ' || lower(COALESCE(brand, '')));

        ALTER TABLE food_servings
          ADD COLUMN known_nutrients_mask INTEGER NOT NULL DEFAULT 63;
        ALTER TABLE food_log_entries
          ADD COLUMN snapshot_known_nutrients_mask INTEGER NOT NULL DEFAULT 63;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_active_barcode
          ON foods(barcode_key)
          WHERE barcode_key IS NOT NULL AND archived_at_utc IS NULL;
        CREATE INDEX IF NOT EXISTS idx_foods_search_text ON foods(search_text);
      `);
    }
    if (currentVersion < 3) {
      // A defensive v1 fixture may predate reusable meals. Real v1 installs already have these.
      await db.execAsync(`
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
      const servingCount = Number(
        (await db.getFirstAsync<{ count: number }>('SELECT count(*) AS count FROM food_servings'))
          ?.count ?? 0,
      );
      const logCount = Number(
        (
          await db.getFirstAsync<{ count: number }>(
            'SELECT count(*) AS count FROM food_log_entries',
          )
        )?.count ?? 0,
      );
      const templateItemCount = Number(
        (
          await db.getFirstAsync<{ count: number }>(
            'SELECT count(*) AS count FROM meal_template_items',
          )
        )?.count ?? 0,
      );
      await db.execAsync(`
        CREATE TABLE food_servings_v3 (
          id TEXT PRIMARY KEY,
          food_id TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          grams REAL NOT NULL CHECK (grams >= 0),
          nutrition_basis_amount REAL NOT NULL CHECK (nutrition_basis_amount > 0),
          nutrition_basis_unit TEXT NOT NULL CHECK (nutrition_basis_unit IN ('g','ml','serving')),
          calories REAL NOT NULL CHECK (calories >= 0),
          protein_g REAL NOT NULL CHECK (protein_g >= 0),
          carbs_g REAL NOT NULL CHECK (carbs_g >= 0),
          fat_g REAL NOT NULL CHECK (fat_g >= 0),
          fiber_g REAL NOT NULL CHECK (fiber_g >= 0),
          sodium_mg REAL CHECK (sodium_mg IS NULL OR sodium_mg >= 0),
          known_nutrients_mask INTEGER NOT NULL DEFAULT 63
        );
        INSERT INTO food_servings_v3 (
          id,food_id,description,grams,nutrition_basis_amount,nutrition_basis_unit,calories,
          protein_g,carbs_g,fat_g,fiber_g,sodium_mg,known_nutrients_mask
        )
        SELECT id,food_id,description,grams,grams,'g',calories,protein_g,carbs_g,fat_g,
          fiber_g,sodium_mg,known_nutrients_mask FROM food_servings;

        CREATE TABLE food_log_entries_v3 (
          id TEXT PRIMARY KEY,
          local_date TEXT NOT NULL,
          meal_type TEXT NOT NULL,
          food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
          serving_id TEXT REFERENCES food_servings_v3(id) ON DELETE SET NULL,
          quantity REAL NOT NULL CHECK (quantity > 0),
          quantity_amount REAL NOT NULL CHECK (quantity_amount > 0),
          quantity_unit TEXT NOT NULL CHECK (quantity_unit IN ('servings','grams','milliliters')),
          snapshot_food_name TEXT NOT NULL,
          snapshot_brand TEXT,
          snapshot_serving_description TEXT NOT NULL,
          snapshot_serving_grams REAL NOT NULL CHECK (snapshot_serving_grams >= 0),
          snapshot_nutrition_basis_amount REAL NOT NULL CHECK (snapshot_nutrition_basis_amount > 0),
          snapshot_nutrition_basis_unit TEXT NOT NULL
            CHECK (snapshot_nutrition_basis_unit IN ('g','ml','serving')),
          snapshot_calories REAL NOT NULL,
          snapshot_protein_g REAL NOT NULL,
          snapshot_carbs_g REAL NOT NULL,
          snapshot_fat_g REAL NOT NULL,
          snapshot_fiber_g REAL NOT NULL,
          snapshot_sodium_mg REAL,
          snapshot_known_nutrients_mask INTEGER NOT NULL DEFAULT 63,
          logged_at_utc TEXT NOT NULL
        );
        INSERT INTO food_log_entries_v3 (
          id,local_date,meal_type,food_id,serving_id,quantity,quantity_amount,quantity_unit,
          snapshot_food_name,snapshot_brand,snapshot_serving_description,snapshot_serving_grams,
          snapshot_nutrition_basis_amount,snapshot_nutrition_basis_unit,snapshot_calories,
          snapshot_protein_g,snapshot_carbs_g,snapshot_fat_g,snapshot_fiber_g,snapshot_sodium_mg,
          snapshot_known_nutrients_mask,logged_at_utc
        )
        SELECT id,local_date,meal_type,food_id,serving_id,quantity,
          quantity * snapshot_serving_grams,'grams',snapshot_food_name,snapshot_brand,
          snapshot_serving_description,snapshot_serving_grams,snapshot_serving_grams,'g',
          snapshot_calories,snapshot_protein_g,snapshot_carbs_g,snapshot_fat_g,snapshot_fiber_g,
          snapshot_sodium_mg,snapshot_known_nutrients_mask,logged_at_utc FROM food_log_entries;

        CREATE TABLE meal_template_items_v3 (
          id TEXT PRIMARY KEY,
          template_id TEXT NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
          food_id TEXT NOT NULL REFERENCES foods(id),
          serving_id TEXT NOT NULL REFERENCES food_servings_v3(id),
          quantity REAL NOT NULL CHECK (quantity > 0),
          sort_order INTEGER NOT NULL
        );
        INSERT INTO meal_template_items_v3
          SELECT id,template_id,food_id,serving_id,quantity,sort_order FROM meal_template_items;
      `);
      const copiedServingCount = Number(
        (
          await db.getFirstAsync<{ count: number }>(
            'SELECT count(*) AS count FROM food_servings_v3',
          )
        )?.count ?? 0,
      );
      const copiedLogCount = Number(
        (
          await db.getFirstAsync<{ count: number }>(
            'SELECT count(*) AS count FROM food_log_entries_v3',
          )
        )?.count ?? 0,
      );
      const copiedTemplateItemCount = Number(
        (
          await db.getFirstAsync<{ count: number }>(
            'SELECT count(*) AS count FROM meal_template_items_v3',
          )
        )?.count ?? 0,
      );
      if (
        copiedServingCount !== servingCount ||
        copiedLogCount !== logCount ||
        copiedTemplateItemCount !== templateItemCount
      ) {
        throw new Error('MIGRATION_V3_COUNT_MISMATCH');
      }
      const foreignKeyIssue = await db.getFirstAsync<{ table: string }>(
        'SELECT "table" FROM pragma_foreign_key_check LIMIT 1',
      );
      if (foreignKeyIssue) throw new Error('MIGRATION_V3_FOREIGN_KEY_CHECK_FAILED');
      await db.execAsync(`
        DROP TABLE meal_template_items;
        DROP TABLE food_log_entries;
        DROP TABLE food_servings;
        ALTER TABLE food_servings_v3 RENAME TO food_servings;
        ALTER TABLE food_log_entries_v3 RENAME TO food_log_entries;
        ALTER TABLE meal_template_items_v3 RENAME TO meal_template_items;
        CREATE INDEX idx_log_local_date ON food_log_entries(local_date, meal_type);
        CREATE TABLE food_aliases (
          id TEXT PRIMARY KEY,
          food_id TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
          language TEXT NOT NULL CHECK (language IN ('es','en')),
          value TEXT NOT NULL,
          normalized_value TEXT NOT NULL,
          UNIQUE(food_id, language, normalized_value)
        );
        CREATE INDEX idx_food_aliases_search ON food_aliases(normalized_value);
        CREATE TABLE logging_preferences (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          quick_menu_side TEXT NOT NULL DEFAULT 'right' CHECK (quick_menu_side IN ('left','right')),
          dashboard_visualization TEXT NOT NULL DEFAULT 'rings'
            CHECK (dashboard_visualization IN ('bars','rings'))
        );
        INSERT INTO logging_preferences (id) VALUES (1);
        CREATE TABLE catalog_state (
          key TEXT PRIMARY KEY,
          version TEXT NOT NULL,
          seeded_at_utc TEXT NOT NULL
        );
      `);
      const swappedForeignKeyIssue = await db.getFirstAsync<{ table: string }>(
        'SELECT "table" FROM pragma_foreign_key_check LIMIT 1',
      );
      if (swappedForeignKeyIssue) throw new Error('MIGRATION_V3_FOREIGN_KEY_CHECK_FAILED');
    }
    if (currentVersion < 4) {
      await db.execAsync(`
        CREATE TABLE food_last_quantities (
          food_id TEXT PRIMARY KEY REFERENCES foods(id) ON DELETE CASCADE,
          amount REAL NOT NULL CHECK (amount > 0),
          unit TEXT NOT NULL CHECK (unit IN ('servings','grams','milliliters')),
          updated_at_utc TEXT NOT NULL
        );
      `);
      const foreignKeyIssue = await db.getFirstAsync<{ table: string }>(
        'SELECT "table" FROM pragma_foreign_key_check LIMIT 1',
      );
      if (foreignKeyIssue) throw new Error('MIGRATION_V4_FOREIGN_KEY_CHECK_FAILED');
    }
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}

export function plannedMigrationVersions(currentVersion: number): number[] {
  return [1, 2, 3, 4].filter((version) => version > currentVersion);
}
