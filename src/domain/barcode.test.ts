import { hasValidGtinCheckDigit, normalizeBarcode } from './barcode';

describe('barcode normalization', () => {
  test('accepts and canonicalizes EAN-13, EAN-8, and UPC-A', () => {
    expect(normalizeBarcode('4006381333931')).toMatchObject({
      format: 'ean13',
      canonicalKey: 'gtin:4006381333931',
    });
    expect(normalizeBarcode('96385074')).toMatchObject({
      format: 'ean8',
      canonicalKey: 'gtin:96385074',
    });
    expect(normalizeBarcode('036000291452')).toMatchObject({
      format: 'upc_a',
      canonicalKey: 'gtin:0036000291452',
    });
  });

  test('expands and canonicalizes a valid UPC-E code', () => {
    expect(normalizeBarcode('01234565', 'upc_e')).toMatchObject({
      format: 'upc_e',
      canonicalKey: 'gtin:0012345000065',
    });
  });

  test('rejects malformed values and an invalid checksum', () => {
    expect(normalizeBarcode('4006381333932')).toBeNull();
    expect(normalizeBarcode('abc-123')).toBeNull();
    expect(hasValidGtinCheckDigit('12345671')).toBe(false);
  });
});
