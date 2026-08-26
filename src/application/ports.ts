import type {
  FoodDraft,
  FoodLogEntry,
  FoodWithServing,
  LocalDate,
  MealTemplate,
  MealType,
  NutritionGoals,
  Profile,
  Settings,
  UUID,
  WeightEntry,
} from '@/domain/types';

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  save(settings: Settings): Promise<void>;
}

export interface ProfileRepository {
  get(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
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
  get(id: UUID): Promise<FoodWithServing | null>;
  create(id: UUID, servingId: UUID, draft: FoodDraft, nowUtc: string): Promise<FoodWithServing>;
  update(id: UUID, draft: FoodDraft, nowUtc: string): Promise<FoodWithServing>;
  setFavorite(id: UUID, favorite: boolean, nowUtc: string): Promise<void>;
  archive(id: UUID, nowUtc: string): Promise<void>;
}

export interface FoodLogRepository {
  listForDate(localDate: LocalDate): Promise<FoodLogEntry[]>;
  add(entry: FoodLogEntry): Promise<void>;
  remove(id: UUID): Promise<void>;
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
  mealTemplates: MealTemplateRepository;
  maintenance: DataMaintenanceRepository;
  transactions: TransactionRunner;
}

export interface SaveMealTemplateInput {
  name: string;
  localDate: LocalDate;
  mealType: MealType;
}
