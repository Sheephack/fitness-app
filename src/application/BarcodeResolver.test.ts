import { BarcodeResolver } from './BarcodeResolver';
import type { ExternalFoodProduct, FoodProductProvider, FoodRepository } from './ports';
import { normalizeBarcode } from '@/domain/barcode';

const barcode = normalizeBarcode('4006381333931')!;
const product: ExternalFoodProduct = {
  barcode,
  name: 'Producto',
  brand: null,
  quantityDescription: null,
  servingDescription: '100 g',
  servingGrams: 100,
  basis: 'per_100g',
  nutrition: { calories: 100, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sodiumMg: null },
  knownNutrients: {
    calories: true,
    proteinG: false,
    carbsG: false,
    fatG: false,
    fiberG: false,
    sodiumMg: false,
  },
  externalId: '4006381333931',
  sourceUpdatedAtUtc: null,
};

function foodRepository(local: unknown = null): FoodRepository {
  return { findByBarcode: jest.fn(async () => local) } as unknown as FoodRepository;
}

describe('BarcodeResolver', () => {
  test('uses the local repository before the provider', async () => {
    const local = { food: { id: 'food' }, serving: { id: 'serving' } };
    const provider: FoodProductProvider = { findByBarcode: jest.fn() };
    const resolver = new BarcodeResolver(foodRepository(local), provider);
    await expect(resolver.resolve('4006381333931')).resolves.toMatchObject({
      kind: 'local',
      food: local,
    });
    expect(provider.findByBarcode).not.toHaveBeenCalled();
  });

  test('deduplicates simultaneous remote lookups', async () => {
    let release: ((result: { kind: 'found'; product: ExternalFoodProduct }) => void) | undefined;
    const provider: FoodProductProvider = {
      findByBarcode: jest.fn(
        () =>
          new Promise((resolve) => {
            release = resolve;
          }),
      ),
    };
    const resolver = new BarcodeResolver(foodRepository(), provider);
    const first = resolver.resolve('4006381333931');
    const second = resolver.resolve('4006381333931');
    await Promise.resolve();
    expect(provider.findByBarcode).toHaveBeenCalledTimes(1);
    release?.({ kind: 'found', product });
    await expect(first).resolves.toMatchObject({ kind: 'remote' });
    await expect(second).resolves.toMatchObject({ kind: 'remote' });
  });
});
