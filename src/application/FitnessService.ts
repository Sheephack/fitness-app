import type { AppRepositories, Clock, IdGenerator, SaveMealTemplateInput } from './ports';
import { addLocalDays } from '@/domain/localDate';
import { evaluateDailyBalance, type BalanceAssessment } from '@/domain/balanceEngine';
import { normalizeFoodSearch, totalNutrition } from '@/domain/nutrition';
import { calculateWeightSummary, type WeightSummary } from '@/domain/weightTrend';
import type {
  FoodDraft,
  FoodLogEntry,
  FoodWithServing,
  LocalDate,
  MealTemplate,
  MealType,
  NutritionGoals,
  NutritionValues,
  Profile,
  ProfileDraft,
  Settings,
  SupportedLanguage,
  UUID,
  UnitSystem,
} from '@/domain/types';

export interface DashboardData {
  localDate: LocalDate;
  profile: Profile | null;
  goals: NutritionGoals | null;
  entries: FoodLogEntry[];
  totals: NutritionValues;
  balance: BalanceAssessment | null;
  weight: WeightSummary;
}

export class FitnessService {
  constructor(
    private readonly repositories: AppRepositories,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async initializeSettings(defaults: Settings): Promise<Settings> {
    const current = await this.repositories.settings.get();
    if (current) return current;
    await this.repositories.settings.save(defaults);
    return defaults;
  }

  getSettings() {
    return this.repositories.settings.get();
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    const settings = await this.requireSettings();
    await this.repositories.settings.save({ ...settings, language });
  }

  async setUnitSystem(unitSystem: UnitSystem): Promise<void> {
    const settings = await this.requireSettings();
    await this.repositories.settings.save({ ...settings, unitSystem });
  }

  getProfile() {
    return this.repositories.profiles.get();
  }

  async saveProfile(draft: ProfileDraft, recordWeight: boolean): Promise<Profile> {
    const now = this.clock.now();
    const existing = await this.repositories.profiles.get();
    const profile: Profile = {
      id: existing?.id ?? (await this.ids.next()),
      nickname: draft.nickname.trim(),
      birthDate: draft.birthDate,
      heightCm: draft.heightCm,
      targetWeightKg: draft.targetWeightKg,
      activityLevel: draft.activityLevel,
      goalType: draft.goalType,
      targetPaceKgPerWeek: draft.goalType === 'maintain' ? null : draft.targetPaceKgPerWeek,
      createdAtUtc: existing?.createdAtUtc ?? now.utc,
      updatedAtUtc: now.utc,
    };
    await this.repositories.transactions.run(async () => {
      await this.repositories.profiles.save(profile);
      if (recordWeight) {
        await this.repositories.weights.add({
          id: await this.ids.next(),
          weightKg: draft.currentWeightKg,
          measuredAtUtc: now.utc,
          localDate: now.localDate,
          note: null,
        });
      }
      const settings = await this.requireSettings();
      await this.repositories.settings.save({
        ...settings,
        unitSystem: draft.unitSystem,
        onboardingCompleted: true,
      });
    });
    return profile;
  }

  getNutritionGoals() {
    return this.repositories.nutritionGoals.getActive();
  }

  async saveNutritionGoals(
    input: Omit<NutritionGoals, 'id' | 'createdAtUtc' | 'updatedAtUtc' | 'effectiveFrom'>,
  ): Promise<NutritionGoals> {
    const now = this.clock.now();
    const existing = await this.repositories.nutritionGoals.getActive();
    const goals: NutritionGoals = {
      ...input,
      id: existing?.id ?? (await this.ids.next()),
      effectiveFrom: existing?.effectiveFrom ?? now.localDate,
      createdAtUtc: existing?.createdAtUtc ?? now.utc,
      updatedAtUtc: now.utc,
    };
    await this.repositories.nutritionGoals.save(goals);
    return goals;
  }

  listFoods(query = '') {
    return this.repositories.foods.list(query);
  }

  listRecentFoods(limit = 10) {
    return this.repositories.foods.listRecent(limit);
  }

  getFood(id: UUID) {
    return this.repositories.foods.get(id);
  }

  async createFood(draft: FoodDraft) {
    const now = this.clock.now();
    return this.repositories.foods.create(
      await this.ids.next(),
      await this.ids.next(),
      { ...draft, name: draft.name.trim(), brand: draft.brand?.trim() || null },
      now.utc,
    );
  }

  async updateFood(id: UUID, draft: FoodDraft) {
    return this.repositories.foods.update(
      id,
      { ...draft, name: draft.name.trim(), brand: draft.brand?.trim() || null },
      this.clock.now().utc,
    );
  }

  async toggleFavorite(food: FoodWithServing) {
    await this.repositories.foods.setFavorite(
      food.food.id,
      !food.food.isFavorite,
      this.clock.now().utc,
    );
  }

  archiveFood(id: UUID) {
    return this.repositories.foods.archive(id, this.clock.now().utc);
  }

  async logFood(
    food: FoodWithServing,
    mealType: MealType,
    quantity: number,
    localDate = this.clock.now().localDate,
  ): Promise<void> {
    const now = this.clock.now();
    await this.repositories.foodLog.add({
      id: await this.ids.next(),
      localDate,
      mealType,
      foodId: food.food.id,
      servingId: food.serving.id,
      quantity,
      snapshot: {
        foodName: food.food.name,
        brand: food.food.brand,
        servingDescription: food.serving.description,
        servingGrams: food.serving.grams,
        calories: food.serving.calories,
        proteinG: food.serving.proteinG,
        carbsG: food.serving.carbsG,
        fatG: food.serving.fatG,
        fiberG: food.serving.fiberG,
        sodiumMg: food.serving.sodiumMg,
      },
      loggedAtUtc: now.utc,
    });
  }

  listFoodLog(localDate = this.clock.now().localDate) {
    return this.repositories.foodLog.listForDate(localDate);
  }

  removeFoodLogEntry(id: UUID) {
    return this.repositories.foodLog.remove(id);
  }

  async duplicateYesterday(
    mealType: MealType,
    target = this.clock.now().localDate,
  ): Promise<number> {
    const yesterday = addLocalDays(target, -1);
    const source = (await this.repositories.foodLog.listForDate(yesterday)).filter(
      (entry) => entry.mealType === mealType,
    );
    await this.repositories.transactions.run(async () => {
      for (const entry of source) {
        await this.repositories.foodLog.add({
          ...entry,
          id: await this.ids.next(),
          localDate: target,
          loggedAtUtc: this.clock.now().utc,
        });
      }
    });
    return source.length;
  }

  async saveMealTemplate(input: SaveMealTemplateInput): Promise<MealTemplate> {
    const entries = (await this.repositories.foodLog.listForDate(input.localDate)).filter(
      (entry) => entry.mealType === input.mealType && entry.foodId && entry.servingId,
    );
    if (entries.length === 0) throw new Error('EMPTY_MEAL');
    const now = this.clock.now().utc;
    const template: MealTemplate = {
      id: await this.ids.next(),
      name: input.name.trim(),
      items: await Promise.all(
        entries.map(async (entry, index) => ({
          id: await this.ids.next(),
          foodId: entry.foodId as UUID,
          servingId: entry.servingId as UUID,
          quantity: entry.quantity,
          sortOrder: index,
        })),
      ),
      createdAtUtc: now,
      updatedAtUtc: now,
    };
    await this.repositories.mealTemplates.save(template);
    return template;
  }

  listMealTemplates() {
    return this.repositories.mealTemplates.list();
  }

  async logMealTemplate(template: MealTemplate, mealType: MealType): Promise<number> {
    let logged = 0;
    await this.repositories.transactions.run(async () => {
      for (const item of template.items.sort((a, b) => a.sortOrder - b.sortOrder)) {
        const food = await this.repositories.foods.get(item.foodId);
        if (!food || food.food.archivedAtUtc) continue;
        await this.logFood(food, mealType, item.quantity);
        logged += 1;
      }
    });
    return logged;
  }

  async addWeight(weightKg: number, note: string | null = null): Promise<void> {
    const now = this.clock.now();
    await this.repositories.weights.add({
      id: await this.ids.next(),
      weightKg,
      measuredAtUtc: now.utc,
      localDate: now.localDate,
      note: note?.trim() || null,
    });
  }

  listWeights() {
    return this.repositories.weights.list();
  }

  async getDashboard(localDate = this.clock.now().localDate): Promise<DashboardData> {
    const [profile, goals, entries, weights] = await Promise.all([
      this.repositories.profiles.get(),
      this.repositories.nutritionGoals.getActive(),
      this.repositories.foodLog.listForDate(localDate),
      this.repositories.weights.list(),
    ]);
    const totals = totalNutrition(entries);
    return {
      localDate,
      profile,
      goals,
      entries,
      totals,
      balance: goals ? evaluateDailyBalance(totals, goals) : null,
      weight: calculateWeightSummary(weights, profile?.targetWeightKg ?? null),
    };
  }

  async resetAll(defaults: Settings): Promise<void> {
    await this.repositories.maintenance.resetAll();
    await this.repositories.settings.save(defaults);
  }

  normalizeFoodName(value: string): string {
    return normalizeFoodSearch(value);
  }

  private async requireSettings(): Promise<Settings> {
    const settings = await this.repositories.settings.get();
    if (!settings) throw new Error('Settings not initialized');
    return settings;
  }
}
