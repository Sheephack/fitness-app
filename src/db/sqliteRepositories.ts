import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  AppRepositories,
  DataMaintenanceRepository,
  FoodLogRepository,
  FoodRepository,
  IdGenerator,
  MealTemplateRepository,
  NutritionGoalsRepository,
  ProfileRepository,
  SettingsRepository,
  TransactionRunner,
  WeightRepository,
} from '@/application/ports';
import {
  ALL_NUTRIENTS_KNOWN,
  normalizeFoodSearch,
  nutritionAvailabilityFromMask,
  nutritionAvailabilityToMask,
} from '@/domain/nutrition';
import { parseLocalDate } from '@/domain/localDate';
import type {
  Food,
  Barcode,
  BarcodeFormat,
  FoodDraft,
  FoodLogEntry,
  FoodServing,
  FoodWithServing,
  MealTemplate,
  NutritionGoals,
  Profile,
  Settings,
  UUID,
  WeightEntry,
} from '@/domain/types';

type SqlRow = Record<string, string | number | null>;

function mapFood(row: SqlRow): FoodWithServing {
  const barcodeFormat =
    row.barcode_format === 'ean13' ||
    row.barcode_format === 'ean8' ||
    row.barcode_format === 'upc_a' ||
    row.barcode_format === 'upc_e'
      ? (row.barcode_format as BarcodeFormat)
      : null;
  const food: Food = {
    id: String(row.id),
    name: String(row.name),
    normalizedName: String(row.normalized_name),
    brand: row.brand === null ? null : String(row.brand),
    isFavorite: Number(row.is_favorite) === 1,
    source: row.provider_id !== null ? 'external' : row.source === 'seed' ? 'seed' : 'custom',
    barcode: row.barcode === null ? null : (String(row.barcode) as Barcode),
    barcodeFormat,
    barcodeKey: row.barcode_key === null ? null : String(row.barcode_key),
    providerId: row.provider_id === null ? null : String(row.provider_id),
    externalId: row.external_id === null ? null : String(row.external_id),
    sourceUpdatedAtUtc:
      row.source_updated_at_utc === null ? null : String(row.source_updated_at_utc),
    importedAtUtc: row.imported_at_utc === null ? null : String(row.imported_at_utc),
    verificationStatus:
      row.verification_status === 'reviewed' || row.verification_status === 'edited'
        ? row.verification_status
        : 'not_applicable',
    archivedAtUtc: row.archived_at_utc === null ? null : String(row.archived_at_utc),
    createdAtUtc: String(row.created_at_utc),
    updatedAtUtc: String(row.updated_at_utc),
  };
  const serving: FoodServing = {
    id: String(row.serving_id),
    foodId: food.id,
    description: String(row.description),
    grams: Number(row.grams),
    knownNutrients: nutritionAvailabilityFromMask(Number(row.known_nutrients_mask ?? 63)),
    calories: Number(row.calories),
    proteinG: Number(row.protein_g),
    carbsG: Number(row.carbs_g),
    fatG: Number(row.fat_g),
    fiberG: Number(row.fiber_g),
    sodiumMg: row.sodium_mg === null ? null : Number(row.sodium_mg),
  };
  return { food, serving };
}

const FOOD_SELECT = `
  SELECT f.*, s.id AS serving_id, s.description, s.grams, s.calories,
         s.protein_g, s.carbs_g, s.fat_g, s.fiber_g, s.sodium_mg
  FROM foods f
  JOIN food_servings s ON s.food_id = f.id
`;

class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly db: SQLiteDatabase) {}
  async get(): Promise<Settings | null> {
    const row = await this.db.getFirstAsync<SqlRow>('SELECT * FROM app_settings WHERE id = 1');
    if (!row) return null;
    return {
      language: row.language === 'es' ? 'es' : 'en',
      locale: String(row.locale),
      unitSystem: row.unit_system === 'imperial' ? 'imperial' : 'metric',
      onboardingCompleted: Number(row.onboarding_completed) === 1,
    };
  }
  async save(settings: Settings): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO app_settings (id, language, locale, unit_system, onboarding_completed)
       VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET language=excluded.language, locale=excluded.locale,
         unit_system=excluded.unit_system, onboarding_completed=excluded.onboarding_completed`,
      settings.language,
      settings.locale,
      settings.unitSystem,
      settings.onboardingCompleted ? 1 : 0,
    );
  }
}

class SqliteProfileRepository implements ProfileRepository {
  constructor(private readonly db: SQLiteDatabase) {}
  async get(): Promise<Profile | null> {
    const row = await this.db.getFirstAsync<SqlRow>(
      'SELECT * FROM profiles ORDER BY updated_at_utc DESC LIMIT 1',
    );
    if (!row) return null;
    return {
      id: String(row.id),
      nickname: String(row.nickname),
      birthDate: parseLocalDate(String(row.birth_date)),
      heightCm: Number(row.height_cm),
      targetWeightKg: Number(row.target_weight_kg),
      activityLevel:
        row.activity_level === 'sedentary' ||
        row.activity_level === 'light' ||
        row.activity_level === 'high'
          ? row.activity_level
          : 'moderate',
      goalType: row.goal_type === 'lose' || row.goal_type === 'gain' ? row.goal_type : 'maintain',
      targetPaceKgPerWeek:
        row.target_pace_kg_week === null ? null : Number(row.target_pace_kg_week),
      createdAtUtc: String(row.created_at_utc),
      updatedAtUtc: String(row.updated_at_utc),
    };
  }
  async save(profile: Profile): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO profiles (id,nickname,birth_date,height_cm,target_weight_kg,activity_level,
        goal_type,target_pace_kg_week,created_at_utc,updated_at_utc)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET nickname=excluded.nickname,birth_date=excluded.birth_date,
        height_cm=excluded.height_cm,target_weight_kg=excluded.target_weight_kg,
        activity_level=excluded.activity_level,goal_type=excluded.goal_type,
        target_pace_kg_week=excluded.target_pace_kg_week,updated_at_utc=excluded.updated_at_utc`,
      profile.id,
      profile.nickname,
      profile.birthDate,
      profile.heightCm,
      profile.targetWeightKg,
      profile.activityLevel,
      profile.goalType,
      profile.targetPaceKgPerWeek,
      profile.createdAtUtc,
      profile.updatedAtUtc,
    );
    await this.db.runAsync(
      `INSERT INTO body_measurements (profile_id,kind,value,measured_at_utc) VALUES (?,'height_cm',?,?)`,
      profile.id,
      profile.heightCm,
      profile.updatedAtUtc,
    );
  }
}

class SqliteWeightRepository implements WeightRepository {
  constructor(private readonly db: SQLiteDatabase) {}
  async list(): Promise<WeightEntry[]> {
    const rows = await this.db.getAllAsync<SqlRow>(
      'SELECT * FROM weight_entries ORDER BY measured_at_utc ASC',
    );
    return rows.map((row) => ({
      id: String(row.id),
      weightKg: Number(row.weight_kg),
      measuredAtUtc: String(row.measured_at_utc),
      localDate: parseLocalDate(String(row.local_date)),
      note: row.note === null ? null : String(row.note),
    }));
  }
  async add(entry: WeightEntry): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO weight_entries (id,weight_kg,measured_at_utc,local_date,note) VALUES (?,?,?,?,?)',
      entry.id,
      entry.weightKg,
      entry.measuredAtUtc,
      entry.localDate,
      entry.note,
    );
  }
}

class SqliteNutritionGoalsRepository implements NutritionGoalsRepository {
  constructor(private readonly db: SQLiteDatabase) {}
  async getActive(): Promise<NutritionGoals | null> {
    const row = await this.db.getFirstAsync<SqlRow>(
      'SELECT * FROM nutrition_goals ORDER BY effective_from DESC, updated_at_utc DESC LIMIT 1',
    );
    if (!row) return null;
    return {
      id: String(row.id),
      caloriesTarget: Number(row.calories_target),
      protein: { min: Number(row.protein_min), max: Number(row.protein_max) },
      carbs: { min: Number(row.carbs_min), max: Number(row.carbs_max) },
      fat: { min: Number(row.fat_min), max: Number(row.fat_max) },
      fiber: { min: Number(row.fiber_min), max: Number(row.fiber_max) },
      effectiveFrom: parseLocalDate(String(row.effective_from)),
      createdAtUtc: String(row.created_at_utc),
      updatedAtUtc: String(row.updated_at_utc),
    };
  }
  async save(goals: NutritionGoals): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO nutrition_goals VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET calories_target=excluded.calories_target,
       protein_min=excluded.protein_min,protein_max=excluded.protein_max,
       carbs_min=excluded.carbs_min,carbs_max=excluded.carbs_max,
       fat_min=excluded.fat_min,fat_max=excluded.fat_max,
       fiber_min=excluded.fiber_min,fiber_max=excluded.fiber_max,
       effective_from=excluded.effective_from,updated_at_utc=excluded.updated_at_utc`,
      goals.id,
      goals.caloriesTarget,
      goals.protein.min,
      goals.protein.max,
      goals.carbs.min,
      goals.carbs.max,
      goals.fat.min,
      goals.fat.max,
      goals.fiber.min,
      goals.fiber.max,
      goals.effectiveFrom,
      goals.createdAtUtc,
      goals.updatedAtUtc,
    );
  }
}

class SqliteFoodRepository implements FoodRepository {
  constructor(private readonly db: SQLiteDatabase) {}
  async list(query = ''): Promise<FoodWithServing[]> {
    const normalized = normalizeFoodSearch(query);
    const rows = await this.db.getAllAsync<SqlRow>(
      `${FOOD_SELECT}
       LEFT JOIN (
         SELECT food_id, MAX(logged_at_utc) AS recent_at
         FROM food_log_entries WHERE food_id IS NOT NULL GROUP BY food_id
       ) recent ON recent.food_id=f.id
       WHERE f.archived_at_utc IS NULL AND f.search_text LIKE ?
       ORDER BY
         CASE WHEN f.normalized_name=? THEN 0 WHEN f.normalized_name LIKE ? THEN 1 ELSE 2 END,
         f.is_favorite DESC,
         CASE WHEN recent.recent_at IS NULL THEN 1 ELSE 0 END,
         recent.recent_at DESC,
         f.name COLLATE NOCASE ASC`,
      `%${normalized}%`,
      normalized,
      `${normalized}%`,
    );
    return rows.map(mapFood);
  }
  async listRecent(limit: number): Promise<FoodWithServing[]> {
    const rows = await this.db.getAllAsync<SqlRow>(
      `${FOOD_SELECT}
       JOIN (SELECT food_id, MAX(logged_at_utc) AS recent_at FROM food_log_entries
             WHERE food_id IS NOT NULL GROUP BY food_id) r ON r.food_id=f.id
       WHERE f.archived_at_utc IS NULL ORDER BY r.recent_at DESC LIMIT ?`,
      limit,
    );
    return rows.map(mapFood);
  }
  async listFavorites(limit: number): Promise<FoodWithServing[]> {
    const rows = await this.db.getAllAsync<SqlRow>(
      `${FOOD_SELECT}
       WHERE f.archived_at_utc IS NULL AND f.is_favorite=1
       ORDER BY f.updated_at_utc DESC, f.name COLLATE NOCASE ASC LIMIT ?`,
      limit,
    );
    return rows.map(mapFood);
  }
  async get(id: UUID): Promise<FoodWithServing | null> {
    const row = await this.db.getFirstAsync<SqlRow>(`${FOOD_SELECT} WHERE f.id=? LIMIT 1`, id);
    return row ? mapFood(row) : null;
  }
  async findByBarcode(canonicalKey: string): Promise<FoodWithServing | null> {
    const row = await this.db.getFirstAsync<SqlRow>(
      `${FOOD_SELECT} WHERE f.barcode_key=? AND f.archived_at_utc IS NULL LIMIT 1`,
      canonicalKey,
    );
    return row ? mapFood(row) : null;
  }
  async create(
    id: UUID,
    servingId: UUID,
    draft: FoodDraft,
    nowUtc: string,
  ): Promise<FoodWithServing> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO foods (
          id,name,normalized_name,brand,is_favorite,source,archived_at_utc,created_at_utc,updated_at_utc,
          barcode,barcode_format,barcode_key,provider_id,external_id,source_updated_at_utc,
          imported_at_utc,verification_status,search_text
        ) VALUES (?,?,?,?,0,'custom',NULL,?,?,?,?,?,?,?,?,?,?,?)`,
        id,
        draft.name,
        normalizeFoodSearch(draft.name),
        draft.brand,
        nowUtc,
        nowUtc,
        draft.barcode?.value ?? null,
        draft.barcode?.format ?? null,
        draft.barcode?.canonicalKey ?? null,
        draft.providerId ?? null,
        draft.externalId ?? null,
        draft.sourceUpdatedAtUtc ?? null,
        draft.importedAtUtc ?? null,
        draft.verificationStatus ?? 'not_applicable',
        normalizeFoodSearch(`${draft.name} ${draft.brand ?? ''}`),
      );
      await this.db.runAsync(
        `INSERT INTO food_servings (
          id,food_id,description,grams,calories,protein_g,carbs_g,fat_g,fiber_g,sodium_mg,
          known_nutrients_mask
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        servingId,
        id,
        draft.servingDescription,
        draft.servingGrams,
        draft.calories,
        draft.proteinG,
        draft.carbsG,
        draft.fatG,
        draft.fiberG,
        draft.sodiumMg,
        nutritionAvailabilityToMask(draft.knownNutrients ?? ALL_NUTRIENTS_KNOWN),
      );
    });
    return (await this.get(id)) as FoodWithServing;
  }
  async update(id: UUID, draft: FoodDraft, nowUtc: string): Promise<FoodWithServing> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE foods SET name=?, normalized_name=?, brand=?, search_text=?, updated_at_utc=?,
         verification_status=CASE WHEN provider_id IS NOT NULL THEN 'edited' ELSE verification_status END
         WHERE id=?`,
        draft.name,
        normalizeFoodSearch(draft.name),
        draft.brand,
        normalizeFoodSearch(`${draft.name} ${draft.brand ?? ''}`),
        nowUtc,
        id,
      );
      await this.db.runAsync(
        `UPDATE food_servings SET description=?,grams=?,calories=?,protein_g=?,carbs_g=?,fat_g=?,fiber_g=?,sodium_mg=?,
         known_nutrients_mask=?
         WHERE food_id=?`,
        draft.servingDescription,
        draft.servingGrams,
        draft.calories,
        draft.proteinG,
        draft.carbsG,
        draft.fatG,
        draft.fiberG,
        draft.sodiumMg,
        nutritionAvailabilityToMask(draft.knownNutrients ?? ALL_NUTRIENTS_KNOWN),
        id,
      );
    });
    return (await this.get(id)) as FoodWithServing;
  }
  async setFavorite(id: UUID, favorite: boolean, nowUtc: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE foods SET is_favorite=?,updated_at_utc=? WHERE id=?',
      favorite ? 1 : 0,
      nowUtc,
      id,
    );
  }
  async archive(id: UUID, nowUtc: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE foods SET archived_at_utc=?,updated_at_utc=? WHERE id=? AND source='custom'",
      nowUtc,
      nowUtc,
      id,
    );
  }
}

class SqliteFoodLogRepository implements FoodLogRepository {
  constructor(private readonly db: SQLiteDatabase) {}
  async listForDate(localDate: ReturnType<typeof parseLocalDate>): Promise<FoodLogEntry[]> {
    const rows = await this.db.getAllAsync<SqlRow>(
      'SELECT * FROM food_log_entries WHERE local_date=? ORDER BY logged_at_utc ASC',
      localDate,
    );
    return rows.map((row) => ({
      id: String(row.id),
      localDate: parseLocalDate(String(row.local_date)),
      mealType:
        row.meal_type === 'breakfast' ||
        row.meal_type === 'lunch' ||
        row.meal_type === 'snack' ||
        row.meal_type === 'dinner'
          ? row.meal_type
          : 'other',
      foodId: row.food_id === null ? null : String(row.food_id),
      servingId: row.serving_id === null ? null : String(row.serving_id),
      quantity: Number(row.quantity),
      snapshot: {
        foodName: String(row.snapshot_food_name),
        brand: row.snapshot_brand === null ? null : String(row.snapshot_brand),
        servingDescription: String(row.snapshot_serving_description),
        servingGrams: Number(row.snapshot_serving_grams),
        knownNutrients: nutritionAvailabilityFromMask(
          Number(row.snapshot_known_nutrients_mask ?? 63),
        ),
        calories: Number(row.snapshot_calories),
        proteinG: Number(row.snapshot_protein_g),
        carbsG: Number(row.snapshot_carbs_g),
        fatG: Number(row.snapshot_fat_g),
        fiberG: Number(row.snapshot_fiber_g),
        sodiumMg: row.snapshot_sodium_mg === null ? null : Number(row.snapshot_sodium_mg),
      },
      loggedAtUtc: String(row.logged_at_utc),
    }));
  }
  async add(entry: FoodLogEntry): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO food_log_entries (
        id,local_date,meal_type,food_id,serving_id,quantity,snapshot_food_name,snapshot_brand,
        snapshot_serving_description,snapshot_serving_grams,snapshot_calories,snapshot_protein_g,
        snapshot_carbs_g,snapshot_fat_g,snapshot_fiber_g,snapshot_sodium_mg,logged_at_utc,
        snapshot_known_nutrients_mask
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      entry.id,
      entry.localDate,
      entry.mealType,
      entry.foodId,
      entry.servingId,
      entry.quantity,
      entry.snapshot.foodName,
      entry.snapshot.brand,
      entry.snapshot.servingDescription,
      entry.snapshot.servingGrams,
      entry.snapshot.calories,
      entry.snapshot.proteinG,
      entry.snapshot.carbsG,
      entry.snapshot.fatG,
      entry.snapshot.fiberG,
      entry.snapshot.sodiumMg,
      entry.loggedAtUtc,
      nutritionAvailabilityToMask(entry.snapshot.knownNutrients),
    );
  }
  async remove(id: UUID): Promise<void> {
    await this.db.runAsync('DELETE FROM food_log_entries WHERE id=?', id);
  }
}

class SqliteMealTemplateRepository implements MealTemplateRepository {
  constructor(private readonly db: SQLiteDatabase) {}
  async list(): Promise<MealTemplate[]> {
    const templates = await this.db.getAllAsync<SqlRow>(
      'SELECT * FROM meal_templates ORDER BY updated_at_utc DESC',
    );
    return Promise.all(
      templates.map(async (template) => {
        const items = await this.db.getAllAsync<SqlRow>(
          'SELECT * FROM meal_template_items WHERE template_id=? ORDER BY sort_order ASC',
          String(template.id),
        );
        return {
          id: String(template.id),
          name: String(template.name),
          createdAtUtc: String(template.created_at_utc),
          updatedAtUtc: String(template.updated_at_utc),
          items: items.map((item) => ({
            id: String(item.id),
            foodId: String(item.food_id),
            servingId: String(item.serving_id),
            quantity: Number(item.quantity),
            sortOrder: Number(item.sort_order),
          })),
        };
      }),
    );
  }
  async save(template: MealTemplate): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        'INSERT INTO meal_templates (id,name,created_at_utc,updated_at_utc) VALUES (?,?,?,?)',
        template.id,
        template.name,
        template.createdAtUtc,
        template.updatedAtUtc,
      );
      for (const item of template.items) {
        await this.db.runAsync(
          `INSERT INTO meal_template_items (id,template_id,food_id,serving_id,quantity,sort_order)
           VALUES (?,?,?,?,?,?)`,
          item.id,
          template.id,
          item.foodId,
          item.servingId,
          item.quantity,
          item.sortOrder,
        );
      }
    });
  }
}

class SqliteMaintenanceRepository implements DataMaintenanceRepository {
  constructor(private readonly db: SQLiteDatabase) {}
  async resetAll(): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.execAsync(`
        DELETE FROM meal_template_items;
        DELETE FROM meal_templates;
        DELETE FROM food_log_entries;
        DELETE FROM food_servings;
        DELETE FROM foods;
        DELETE FROM nutrition_goals;
        DELETE FROM weight_entries;
        DELETE FROM body_measurements;
        DELETE FROM profiles;
        DELETE FROM app_settings;
      `);
    });
  }
}

class SqliteTransactionRunner implements TransactionRunner {
  constructor(private readonly db: SQLiteDatabase) {}
  async run<T>(operation: () => Promise<T>): Promise<T> {
    let result: T | undefined;
    await this.db.withTransactionAsync(async () => {
      result = await operation();
    });
    return result as T;
  }
}

export class SqliteIdGenerator implements IdGenerator {
  constructor(private readonly db: SQLiteDatabase) {}
  async next(): Promise<UUID> {
    const row = await this.db.getFirstAsync<{ id: string }>(`
      SELECT lower(
        hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' ||
        substr(hex(randomblob(2)), 2, 3) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2, 3) || '-' ||
        hex(randomblob(6))
      ) AS id
    `);
    if (!row) throw new Error('Unable to generate UUID');
    return row.id;
  }
}

export function createSqliteRepositories(db: SQLiteDatabase): AppRepositories {
  return {
    settings: new SqliteSettingsRepository(db),
    profiles: new SqliteProfileRepository(db),
    weights: new SqliteWeightRepository(db),
    nutritionGoals: new SqliteNutritionGoalsRepository(db),
    foods: new SqliteFoodRepository(db),
    foodLog: new SqliteFoodLogRepository(db),
    mealTemplates: new SqliteMealTemplateRepository(db),
    maintenance: new SqliteMaintenanceRepository(db),
    transactions: new SqliteTransactionRunner(db),
  };
}
