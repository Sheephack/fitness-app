import { z } from 'zod';
import type {
  ExternalFoodProduct,
  FoodProductProvider,
  FoodProductProviderResult,
} from '@/application/ports';
import { scaleNutrition } from '@/domain/nutrition';
import type { NormalizedBarcode, NutritionAvailability, NutritionValues } from '@/domain/types';

const FIELDS = [
  'code',
  'product_name',
  'brands',
  'quantity',
  'product_quantity',
  'product_quantity_unit',
  'serving_size',
  'serving_quantity',
  'serving_quantity_unit',
  'nutriments',
  'last_modified_t',
].join(',');

const productSchema = z
  .object({
    code: z.union([z.string(), z.number()]).optional(),
    product_name: z.string().optional(),
    brands: z.string().optional(),
    quantity: z.string().optional(),
    product_quantity_unit: z.string().optional(),
    serving_size: z.string().optional(),
    serving_quantity: z.union([z.string(), z.number()]).optional(),
    serving_quantity_unit: z.string().optional(),
    nutriments: z.record(z.string(), z.unknown()).optional(),
    last_modified_t: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

const responseSchema = z.object({ product: productSchema.optional() }).passthrough();

function finiteNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function nutrientsFor(
  nutriments: Record<string, unknown>,
  suffix: '_100g' | '_serving',
): { values: NutritionValues; known: NutritionAvailability } {
  const kcal =
    finiteNumber(nutriments[`energy-kcal${suffix}`]) ??
    (() => {
      const kj = finiteNumber(nutriments[`energy-kj${suffix}`]);
      return kj === null ? null : kj / 4.184;
    })();
  const protein = finiteNumber(nutriments[`proteins${suffix}`]);
  const carbs = finiteNumber(nutriments[`carbohydrates${suffix}`]);
  const fat = finiteNumber(nutriments[`fat${suffix}`]);
  const fiber = finiteNumber(nutriments[`fiber${suffix}`]);
  const sodiumG = finiteNumber(nutriments[`sodium${suffix}`]);
  return {
    values: {
      calories: kcal ?? 0,
      proteinG: protein ?? 0,
      carbsG: carbs ?? 0,
      fatG: fat ?? 0,
      fiberG: fiber ?? 0,
      sodiumMg: sodiumG === null ? null : sodiumG * 1000,
    },
    known: {
      calories: kcal !== null,
      proteinG: protein !== null,
      carbsG: carbs !== null,
      fatG: fat !== null,
      fiberG: fiber !== null,
      sodiumMg: sodiumG !== null,
    },
  };
}

export function mapOpenFoodFactsProduct(
  product: z.infer<typeof productSchema>,
  barcode: NormalizedBarcode,
): ExternalFoodProduct {
  const nutriments = product.nutriments ?? {};
  const per100 = nutrientsFor(nutriments, '_100g');
  const perServing = nutrientsFor(nutriments, '_serving');
  const servingUnit = product.serving_quantity_unit?.toLowerCase() ?? null;
  const productUnit = product.product_quantity_unit?.toLowerCase() ?? null;
  const servingQuantity = finiteNumber(product.serving_quantity);
  const volumeOnly =
    (servingUnit === 'ml' || productUnit === 'ml') &&
    !(servingUnit === 'g' && servingQuantity !== null);

  let basis: ExternalFoodProduct['basis'] = 'unknown';
  let servingGrams: number | null = null;
  let servingDescription: string | null = product.serving_size?.trim() || null;
  let nutrition = per100.values;
  let knownNutrients = per100.known;

  if (volumeOnly) {
    basis = 'unsupported_volume';
  } else if (per100.known.calories) {
    basis = 'per_100g';
    servingGrams = servingUnit === 'g' && servingQuantity ? servingQuantity : 100;
    if (!servingDescription || servingGrams === 100) servingDescription = `${servingGrams} g`;
    const factor = servingGrams / 100;
    nutrition = scaleNutrition(per100.values, factor);
  } else if (
    perServing.known.calories &&
    servingUnit === 'g' &&
    servingQuantity !== null &&
    servingQuantity > 0
  ) {
    basis = 'per_serving';
    servingGrams = servingQuantity;
    servingDescription ||= `${servingGrams} g`;
    nutrition = perServing.values;
    knownNutrients = perServing.known;
  }

  const updated = finiteNumber(product.last_modified_t);
  return {
    barcode,
    name: product.product_name?.trim() || null,
    brand: product.brands?.trim() || null,
    quantityDescription: product.quantity?.trim() || null,
    servingDescription,
    servingGrams,
    basis,
    nutrition,
    knownNutrients,
    externalId: String(product.code ?? barcode.value),
    sourceUpdatedAtUtc: updated === null ? null : new Date(updated * 1000).toISOString(),
  };
}

export class OpenFoodFactsProvider implements FoodProductProvider {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly timeoutMs = 8000,
  ) {}

  async findByBarcode(barcode: NormalizedBarcode): Promise<FoodProductProviderResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const url =
        `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode.value)}` +
        `?fields=${encodeURIComponent(FIELDS)}`;
      const response = await this.fetcher(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'FitnessApp/0.1.1 (https://github.com/Sheephack/fitness-app)',
        },
        signal: controller.signal,
      });
      if (response.status === 404) return { kind: 'not_found' };
      if (response.status === 429) {
        return { kind: 'unavailable', reason: 'rate_limited' };
      }
      if (!response.ok) return { kind: 'unavailable', reason: 'server' };
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success || !parsed.data.product) {
        return { kind: 'unavailable', reason: 'invalid_response' };
      }
      return {
        kind: 'found',
        product: mapOpenFoodFactsProduct(parsed.data.product, barcode),
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { kind: 'unavailable', reason: 'timeout' };
      }
      if (error instanceof TypeError) return { kind: 'unavailable', reason: 'offline' };
      return { kind: 'unavailable', reason: 'invalid_response' };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class OfflineFoodProductProvider implements FoodProductProvider {
  async findByBarcode(): Promise<FoodProductProviderResult> {
    return { kind: 'unavailable', reason: 'offline' };
  }
}
