import type {
  AppRepositories,
  Clock,
  FoodRepository,
  IdGenerator,
  MealTemplateRepository,
} from '@/application/ports';
import { FitnessService } from '@/application/FitnessService';
import { SystemClock } from '@/application/systemClock';
import { ALL_NUTRIENTS_KNOWN, normalizeFoodSearch } from '@/domain/nutrition';
import type {
  FoodDraft,
  FoodLogEntry,
  FoodWithServing,
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
            normalizeFoodSearch(`${item.food.name} ${item.food.brand ?? ''}`).includes(normalized),
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
            aExact - bExact ||
            Number(b.food.isFavorite) - Number(a.food.isFavorite) ||
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
      remove: async (id) => {
        state.log = state.log.filter((entry) => entry.id !== id);
      },
    },
    mealTemplates: new MemoryMealTemplateRepository(state),
    maintenance: {
      resetAll: async () => {
        state.settings = null;
        state.profile = null;
        state.weights = [];
        state.goals = null;
        state.foods = [];
        state.log = [];
        state.templates = [];
      },
    },
    transactions: { run: async (operation) => operation() },
  };
  return { service: new FitnessService(repositories, ids, clock), repositories };
}
