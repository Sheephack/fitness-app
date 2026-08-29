import type {
  AppRepositories,
  CatalogFoodSeed,
  CatalogRepository,
  Clock,
  FoodRepository,
  IdGenerator,
  LastFoodQuantityRepository,
  LoggingPreferencesRepository,
  MealTemplateRepository,
} from '@/application/ports';
import { FitnessService } from '@/application/FitnessService';
import { SystemClock } from '@/application/systemClock';
import { ALL_NUTRIENTS_KNOWN, normalizeFoodSearch } from '@/domain/nutrition';
import type {
  FoodDraft,
  FoodLogEntry,
  FoodWithServing,
  HeightMeasurement,
  LastFoodQuantity,
  LoggingPreferences,
  MealTemplate,
  NutritionGoals,
  Profile,
  Settings,
  UUID,
  WeightEntry,
} from '@/domain/types';

interface MemoryState {
  settings: Settings | null;
  profile: Profile | null;
  weights: WeightEntry[];
  goals: NutritionGoals | null;
  foods: FoodWithServing[];
  log: FoodLogEntry[];
  templates: MealTemplate[];
  aliases: Record<string, string[]>;
  catalogVersions: Record<string, string>;
  loggingPreferences: LoggingPreferences;
  lastFoodQuantities: Record<string, LastFoodQuantity>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class DeterministicIdGenerator implements IdGenerator {
  private counter = 1;
  async next(): Promise<UUID> {
    const suffix = this.counter.toString(16).padStart(12, '0');
    this.counter += 1;
    return `00000000-0000-4000-8000-${suffix}`;
  }
}

class MemoryFoodRepository implements FoodRepository {
  constructor(private readonly state: MemoryState) {}
  async list(query = ''): Promise<FoodWithServing[]> {
    const normalized = normalizeFoodSearch(query);
    const recent = new Map(
      [...this.state.log]
        .sort((a, b) => b.loggedAtUtc.localeCompare(a.loggedAtUtc))
        .map((entry, index) => [entry.foodId, index]),
    );
    return clone(
      this.state.foods
        .filter(
          (item) =>
            !item.food.archivedAtUtc &&
            normalizeFoodSearch(
              `${item.food.name} ${item.food.brand ?? ''} ${(this.state.aliases[item.food.id] ?? []).join(' ')}`,
            ).includes(normalized),
        )
        .sort((a, b) => {
          const aExact =
            a.food.normalizedName === normalized
              ? 0
              : a.food.normalizedName.startsWith(normalized)
                ? 1
                : 2;
          const bExact =
            b.food.normalizedName === normalized
              ? 0
              : b.food.normalizedName.startsWith(normalized)
                ? 1
                : 2;
          return (
            Number(b.food.isFavorite) - Number(a.food.isFavorite) ||
            Number(a.food.source === 'seed') - Number(b.food.source === 'seed') ||
            aExact - bExact ||
            (recent.get(a.food.id) ?? Number.MAX_SAFE_INTEGER) -
              (recent.get(b.food.id) ?? Number.MAX_SAFE_INTEGER) ||
            a.food.name.localeCompare(b.food.name)
          );
        }),
    );
  }
  async listRecent(limit: number): Promise<FoodWithServing[]> {
    const ids = [...this.state.log]
      .sort((a, b) => b.loggedAtUtc.localeCompare(a.loggedAtUtc))
      .map((entry) => entry.foodId)
      .filter((id, index, all): id is UUID => Boolean(id) && all.indexOf(id) === index)
      .slice(0, limit);
    return clone(
      ids.flatMap((id) =>
        this.state.foods.filter((food) => food.food.id === id && !food.food.archivedAtUtc),
      ),
    );
  }
  async listFavorites(limit: number): Promise<FoodWithServing[]> {
    return clone(
      this.state.foods
        .filter((item) => item.food.isFavorite && !item.food.archivedAtUtc)
        .slice(0, limit),
    );
  }
  async get(id: UUID): Promise<FoodWithServing | null> {
    return clone(this.state.foods.find((item) => item.food.id === id) ?? null);
  }
  async findByBarcode(canonicalKey: string): Promise<FoodWithServing | null> {
    return clone(
      this.state.foods.find(
        (item) => item.food.barcodeKey === canonicalKey && !item.food.archivedAtUtc,
      ) ?? null,
    );
  }
  async create(
    id: UUID,
    servingId: UUID,
    draft: FoodDraft,
    nowUtc: string,
  ): Promise<FoodWithServing> {
    const item: FoodWithServing = {
      food: {
        id,
        name: draft.name,
        normalizedName: normalizeFoodSearch(draft.name),
        brand: draft.brand,
        isFavorite: false,
        source: 'custom',
        barcode: draft.barcode?.value ?? null,
        barcodeFormat: draft.barcode?.format ?? null,
        barcodeKey: draft.barcode?.canonicalKey ?? null,
        providerId: draft.providerId ?? null,
        externalId: draft.externalId ?? null,
        sourceUpdatedAtUtc: draft.sourceUpdatedAtUtc ?? null,
        importedAtUtc: draft.importedAtUtc ?? null,
        verificationStatus: draft.verificationStatus ?? 'not_applicable',
        archivedAtUtc: null,
        createdAtUtc: nowUtc,
        updatedAtUtc: nowUtc,
      },
      serving: {
        id: servingId,
        foodId: id,
        description: draft.servingDescription,
        grams: draft.servingGrams,
        nutritionBasisAmount: draft.nutritionBasisAmount ?? draft.servingGrams,
        nutritionBasisUnit: draft.nutritionBasisUnit ?? 'g',
        knownNutrients: draft.knownNutrients ?? ALL_NUTRIENTS_KNOWN,
        calories: draft.calories,
        proteinG: draft.proteinG,
        carbsG: draft.carbsG,
        fatG: draft.fatG,
        fiberG: draft.fiberG,
        sodiumMg: draft.sodiumMg,
      },
    };
    this.state.foods.push(item);
    return clone(item);
  }
  async update(id: UUID, draft: FoodDraft, nowUtc: string): Promise<FoodWithServing> {
    const item = this.state.foods.find((candidate) => candidate.food.id === id);
    if (!item) throw new Error('Food not found');
    item.food = {
      ...item.food,
      name: draft.name,
      normalizedName: normalizeFoodSearch(draft.name),
      brand: draft.brand,
      verificationStatus: item.food.providerId ? 'edited' : item.food.verificationStatus,
      updatedAtUtc: nowUtc,
    };
    item.serving = {
      ...item.serving,
      description: draft.servingDescription,
      grams: draft.servingGrams,
      nutritionBasisAmount: draft.nutritionBasisAmount ?? draft.servingGrams,
      nutritionBasisUnit: draft.nutritionBasisUnit ?? 'g',
      calories: draft.calories,
      proteinG: draft.proteinG,
      carbsG: draft.carbsG,
      fatG: draft.fatG,
      fiberG: draft.fiberG,
      sodiumMg: draft.sodiumMg,
      knownNutrients: draft.knownNutrients ?? ALL_NUTRIENTS_KNOWN,
    };
    return clone(item);
  }
  async setFavorite(id: UUID, favorite: boolean, nowUtc: string): Promise<void> {
    const item = this.state.foods.find((candidate) => candidate.food.id === id);
    if (item) item.food = { ...item.food, isFavorite: favorite, updatedAtUtc: nowUtc };
  }
  async archive(id: UUID, nowUtc: string): Promise<void> {
    const item = this.state.foods.find((candidate) => candidate.food.id === id);
    if (item) item.food = { ...item.food, archivedAtUtc: nowUtc, updatedAtUtc: nowUtc };
  }
}

class MemoryLoggingPreferencesRepository implements LoggingPreferencesRepository {
  constructor(private readonly state: MemoryState) {}
  async get(): Promise<LoggingPreferences> {
    return clone(this.state.loggingPreferences);
  }
  async save(preferences: LoggingPreferences): Promise<void> {
    this.state.loggingPreferences = clone(preferences);
  }
}

class MemoryLastFoodQuantityRepository implements LastFoodQuantityRepository {
  constructor(private readonly state: MemoryState) {}
  async get(foodId: UUID): Promise<LastFoodQuantity | null> {
    return clone(this.state.lastFoodQuantities[foodId] ?? null);
  }
  async save(quantity: LastFoodQuantity): Promise<void> {
    this.state.lastFoodQuantities[quantity.foodId] = clone(quantity);
  }
}

function catalogFoodId(fdcId: number): UUID {
  return `00000001-2026-4000-8000-${String(fdcId).padStart(12, '0')}`;
}

function catalogServingId(fdcId: number): UUID {
  return `00000002-2026-4000-8000-${String(fdcId).padStart(12, '0')}`;
}

class MemoryCatalogRepository implements CatalogRepository {
  constructor(private readonly state: MemoryState) {}
  async getVersion(key: string): Promise<string | null> {
    return this.state.catalogVersions[key] ?? null;
  }
  async seed(
    key: string,
    version: string,
    foods: readonly CatalogFoodSeed[],
    nowUtc: string,
  ): Promise<void> {
    if (this.state.catalogVersions[key] === version) return;
    for (const item of foods) {
      const foodId = catalogFoodId(item.fdcId);
      const servingId = catalogServingId(item.fdcId);
      const existing = this.state.foods.findIndex((food) => food.food.id === foodId);
      const existingFood = existing >= 0 ? this.state.foods[existing] : undefined;
      const seeded: FoodWithServing = {
        food: {
          id: foodId,
          name: item.usdaDescription,
          normalizedName: normalizeFoodSearch(item.usdaDescription),
          brand: null,
          isFavorite: existingFood?.food.isFavorite ?? false,
          source: 'seed',
          barcode: null,
          barcodeFormat: null,
          barcodeKey: null,
          providerId: null,
          externalId: `usda:${item.fdcId}`,
          sourceUpdatedAtUtc: null,
          importedAtUtc: null,
          verificationStatus: 'not_applicable',
          archivedAtUtc: null,
          createdAtUtc: existingFood?.food.createdAtUtc ?? nowUtc,
          updatedAtUtc: nowUtc,
        },
        serving: {
          id: servingId,
          foodId,
          description: '100 g',
          grams: 100,
          nutritionBasisAmount: 100,
          nutritionBasisUnit: 'g',
          knownNutrients: item.knownNutrients,
          ...item.per100g,
        },
      };
      if (existing >= 0) this.state.foods[existing] = seeded;
      else this.state.foods.push(seeded);
      this.state.aliases[foodId] = [
        item.presentation.en,
        item.presentation.es,
        ...item.presentation.aliases,
      ].filter(
        (value, index, all) =>
          value.trim().length > 0 &&
          all.findIndex(
            (candidate) => normalizeFoodSearch(candidate) === normalizeFoodSearch(value),
          ) === index,
      );
    }
    this.state.catalogVersions[key] = version;
  }
}

class MemoryMealTemplateRepository implements MealTemplateRepository {
  constructor(private readonly state: MemoryState) {}
  async list() {
    return clone(this.state.templates);
  }
  async save(template: MealTemplate) {
    this.state.templates.push(clone(template));
  }
}

export function createMemoryFitnessService(
  defaults: Settings,
  clock: Clock = new SystemClock(),
  ids: IdGenerator = new DeterministicIdGenerator(),
): FitnessService {
  return createMemoryAppServices(defaults, clock, ids).service;
}

export function createMemoryAppServices(
  defaults: Settings,
  clock: Clock = new SystemClock(),
  ids: IdGenerator = new DeterministicIdGenerator(),
): { service: FitnessService; repositories: AppRepositories } {
  const state: MemoryState = {
    settings: clone(defaults),
    profile: null,
    weights: [],
    goals: null,
    foods: [],
    log: [],
    templates: [],
    aliases: {},
    catalogVersions: {},
    loggingPreferences: { quickMenuSide: 'right', dashboardVisualization: 'rings' },
    lastFoodQuantities: {},
  };
  const foods = new MemoryFoodRepository(state);
  const repositories: AppRepositories = {
    settings: {
      get: async () => clone(state.settings),
      save: async (settings) => {
        state.settings = clone(settings);
      },
    },
    profiles: {
      get: async () => clone(state.profile),
      save: async (profile) => {
        state.profile = clone(profile);
      },
      listHeightMeasurements: async (profileId): Promise<HeightMeasurement[]> => {
        if (!state.profile || state.profile.id !== profileId) return [];
        return [{ valueCm: state.profile.heightCm, measuredAtUtc: state.profile.updatedAtUtc }];
      },
    },
    weights: {
      list: async () => clone(state.weights),
      add: async (entry) => {
        state.weights.push(clone(entry));
      },
    },
    nutritionGoals: {
      getActive: async () => clone(state.goals),
      save: async (goals) => {
        state.goals = clone(goals);
      },
    },
    foods,
    foodLog: {
      listForDate: async (date) => clone(state.log.filter((entry) => entry.localDate === date)),
      add: async (entry) => {
        state.log.push(clone(entry));
      },
      update: async (entry) => {
        const index = state.log.findIndex((candidate) => candidate.id === entry.id);
        if (index >= 0) state.log[index] = clone(entry);
      },
      remove: async (id) => {
        state.log = state.log.filter((entry) => entry.id !== id);
      },
    },
    loggingPreferences: new MemoryLoggingPreferencesRepository(state),
    lastFoodQuantities: new MemoryLastFoodQuantityRepository(state),
    catalog: new MemoryCatalogRepository(state),
    mealTemplates: new MemoryMealTemplateRepository(state),
    maintenance: {
      resetAll: async () => {
        state.settings = null;
        state.profile = null;
        state.weights = [];
        state.goals = null;
        state.foods = state.foods.filter((food) => food.food.source === 'seed');
        state.log = [];
        state.templates = [];
        state.lastFoodQuantities = {};
      },
    },
    transactions: { run: async (operation) => operation() },
  };
  return { service: new FitnessService(repositories, ids, clock), repositories };
}
