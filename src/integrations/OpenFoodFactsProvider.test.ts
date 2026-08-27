import { mapOpenFoodFactsProduct, OpenFoodFactsProvider } from './OpenFoodFactsProvider';
import { normalizeBarcode } from '@/domain/barcode';

const barcode = normalizeBarcode('4006381333931')!;

describe('OpenFoodFactsProvider', () => {
  test('maps per-100g nutrition, kJ fallback, and sodium grams explicitly', () => {
    const product = mapOpenFoodFactsProduct(
      {
        code: '4006381333931',
        product_name: 'Ejemplo',
        serving_quantity: 40,
        serving_quantity_unit: 'g',
        nutriments: { 'energy-kj_100g': 418.4, proteins_100g: 10, sodium_100g: 0.12 },
      },
      barcode,
    );
    expect(product.basis).toBe('per_100g');
    expect(product.servingGrams).toBe(40);
    expect(product.nutrition.calories).toBeCloseTo(40);
    expect(product.nutrition.proteinG).toBe(4);
    expect(product.nutrition.sodiumMg).toBeCloseTo(48);
    expect(product.knownNutrients.carbsG).toBe(false);
  });

  test('requires a real grams serving for nutrition available only per serving', () => {
    const product = mapOpenFoodFactsProduct(
      { product_name: 'Sin gramos', nutriments: { 'energy-kcal_serving': 100 } },
      barcode,
    );
    expect(product.basis).toBe('unknown');
    expect(product.knownNutrients.calories).toBe(false);
  });

  test('returns not found and invalid response without throwing', async () => {
    const notFound = new OpenFoodFactsProvider(async () => new Response('', { status: 404 }));
    await expect(notFound.findByBarcode(barcode)).resolves.toEqual({ kind: 'not_found' });
    const invalid = new OpenFoodFactsProvider(
      async () => new Response('not json', { status: 200 }),
    );
    await expect(invalid.findByBarcode(barcode)).resolves.toMatchObject({
      kind: 'unavailable',
      reason: 'invalid_response',
    });
  });

  test('classifies HTTP failure and timeout without exposing transport details', async () => {
    const server = new OpenFoodFactsProvider(async () => new Response('', { status: 503 }));
    await expect(server.findByBarcode(barcode)).resolves.toEqual({
      kind: 'unavailable',
      reason: 'server',
    });
    const timeout = new OpenFoodFactsProvider(
      async (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
      1,
    );
    await expect(timeout.findByBarcode(barcode)).resolves.toEqual({
      kind: 'unavailable',
      reason: 'timeout',
    });
  });
});
