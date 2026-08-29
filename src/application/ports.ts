import type {
  FoodDraft,
  FoodLogEntry,
  FoodWithServing,
  HeightMeasurement,
  LastFoodQuantity,
  LocalDate,
  MealTemplate,
  MealType,
  NutritionGoals,
  NormalizedBarcode,
  NutritionAvailability,
  NutritionValues,
  LoggingPreferences,
  Profile,
  Settings,
  UUID,
  WeightEntry,
} from '@/domain/types';

export interface ExternalFoodProduct {
  barcode: NormalizedBarcode;
  name: string | null;
  brand: string | null;
  quantityDescription: string | null;
  servingDescription: string | null;
  servingGrams: number | null;
  basis: 'per_100g' | 'per_serving' | 'unsupported_volume' | 'unknown';
  nutrition: NutritionValues;
  knownNutrients: NutritionAvailability;
  externalId: string;
  sourceUpdatedAtUtc: string | null;
}

export type FoodProductProviderResult =
  | { kind: 'found'; product: ExternalFoodProduct }
  | { kind: 'not_found' }
  | {
      kind: 'unavailable';
      reason: 'offline' | 'timeout' | 'rate_limited' | 'server' | 'invalid_response';
    };

export interface FoodProductProvider {
  findByBarcode(barcode: NormalizedBarcode): Promise<FoodProductProviderResult>;
}

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  save(settings: Settings): Promise<void>;
}

export interface ProfileRepository {
  get(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
  listHeightMeasurements(profileId: UUID): Promise<HeightMeasurement[]>;
}

export interface WeightRepository {
  list(): Promise<WeightEntry[]>;
  add(entry: WeightEntry): Promise<void>;
}

export interface NutritionGoalsRepository {
  getActive(): Promise<NutritionGoals | null>;
  save(goals: NutritionGoals): Promise<void>;
}

export interface FoodRepository {
  list(query?: string): Promise<FoodWithServing[]>;
  listRecent(limit: number): Promise<FoodWithServing[]>;
  listFavorites(limit: number): Promise<FoodWithServing[]>;
  get(id: UUID): Promise<FoodWithServing | null>;
  findByBarcode(canonicalKey: string): Promise<FoodWithServing | null>;
  create(id: UUID, servingId: UUID, draft: FoodDraft, nowUtc: string): Promise<FoodWithServing>;
  update(id: UUID, draft: FoodDraft, nowUtc: string): Promise<FoodWithServing>;
  setFavorite(id: UUID, favorite: boolean, nowUtc: string): Promise<void>;
  archive(id: UUID, nowUtc: string): Promise<void>;
}

export interface FoodLogRepository {
  listForDate(localDate: LocalDate): Promise<FoodLogEntry[]>;
  add(entry: FoodLogEntry): Promise<void>;
  update(entry: FoodLogEntry): Promise<void>;
  remove(id: UUID): Promise<void>;
}

export interface LoggingPreferencesRepository {
  get(): Promise<LoggingPreferences>;
  save(preferences: LoggingPreferences): Promise<void>;
}

export interface LastFoodQuantityRepository {
  get(foodId: UUID): Promise<LastFoodQuantity | null>;
  save(quantity: LastFoodQuantity): Promise<void>;
}

export interface CatalogFoodSeed {
  fdcId: number;
  usdaDescription: string;
  per100g: NutritionValues;
  knownNutrients: NutritionAvailability;
  presentation: {
    en: string;
    es: string;
    aliases: readonly string[];
  };
}

export interface CatalogRepository {
  getVersion(key: string): Promise<string | null>;
  seed(
    key: string,
    version: string,
    foods: readonly CatalogFoodSeed[],
    nowUtc: string,
  ): Promise<void>;
}

export interface MealTemplateRepository {
  list(): Promise<MealTemplate[]>;
  save(template: MealTemplate): Promise<void>;
}

export interface DataMaintenanceRepository {
  resetAll(): Promise<void>;
}

export interface TransactionRunner {
  run<T>(operation: () => Promise<T>): Promise<T>;
}

export interface Clock {
  now(): { utc: string; localDate: LocalDate };
}

export interface IdGenerator {
  next(): Promise<UUID>;
}

export interface AppRepositories {
  settings: SettingsRepository;
  profiles: ProfileRepository;
  weights: WeightRepository;
  nutritionGoals: NutritionGoalsRepository;
  foods: FoodRepository;
  foodLog: FoodLogRepository;
  loggingPreferences: LoggingPreferencesRepository;
  lastFoodQuantities: LastFoodQuantityRepository;
  catalog: CatalogRepository;
  mealTemplates: MealTemplateRepository;
  maintenance: DataMaintenanceRepository;
  transactions: TransactionRunner;
}

export interface SaveMealTemplateInput {
  name: string;
  localDate: LocalDate;
  mealType: MealType;
}
