import type {
  ExternalFoodProduct,
  FoodProductProvider,
  FoodProductProviderResult,
  FoodRepository,
} from './ports';
import { normalizeBarcode } from '@/domain/barcode';
import type { BarcodeFormat, FoodWithServing, NormalizedBarcode } from '@/domain/types';

export type BarcodeResolution =
  | { kind: 'local'; barcode: NormalizedBarcode; food: FoodWithServing }
  | { kind: 'remote'; product: ExternalFoodProduct }
  | { kind: 'not_found'; barcode: NormalizedBarcode }
  | { kind: 'offline'; barcode: NormalizedBarcode }
  | { kind: 'provider_error'; barcode: NormalizedBarcode }
  | { kind: 'invalid' };

export class BarcodeResolver {
  private readonly inFlight = new Map<string, Promise<FoodProductProviderResult>>();

  constructor(
    private readonly foods: FoodRepository,
    private readonly provider: FoodProductProvider,
  ) {}

  async resolve(raw: string, format?: BarcodeFormat): Promise<BarcodeResolution> {
    const barcode = normalizeBarcode(raw, format);
    if (!barcode) return { kind: 'invalid' };
    const local = await this.foods.findByBarcode(barcode.canonicalKey);
    if (local) return { kind: 'local', barcode, food: local };

    let request = this.inFlight.get(barcode.canonicalKey);
    if (!request) {
      request = this.provider.findByBarcode(barcode);
      this.inFlight.set(barcode.canonicalKey, request);
    }
    try {
      const result = await request;
      if (result.kind === 'found') return { kind: 'remote', product: result.product };
      if (result.kind === 'not_found') return { kind: 'not_found', barcode };
      if (result.reason === 'offline') return { kind: 'offline', barcode };
      return { kind: 'provider_error', barcode };
    } finally {
      if (this.inFlight.get(barcode.canonicalKey) === request) {
        this.inFlight.delete(barcode.canonicalKey);
      }
    }
  }
}
