import type { Barcode, BarcodeFormat, NormalizedBarcode } from './types';

function expectedCheckDigit(body: string): number {
  const sum = [...body]
    .reverse()
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}

export function hasValidGtinCheckDigit(value: string): boolean {
  if (!/^\d+$/.test(value) || value.length < 2) return false;
  return expectedCheckDigit(value.slice(0, -1)) === Number(value.at(-1));
}

function expandUpcE(value: string): string | null {
  if (!/^\d{8}$/.test(value)) return null;
  const numberSystem = value[0];
  const payload = value.slice(1, 7);
  const check = value[7];
  const [a, b, c, d, e, compression] = payload;
  let body: string;
  if (compression === '0' || compression === '1' || compression === '2') {
    body = `${numberSystem}${a}${b}${compression}0000${c}${d}${e}`;
  } else if (compression === '3') {
    body = `${numberSystem}${a}${b}${c}00000${d}${e}`;
  } else if (compression === '4') {
    body = `${numberSystem}${a}${b}${c}${d}00000${e}`;
  } else {
    body = `${numberSystem}${a}${b}${c}${d}${e}0000${compression}`;
  }
  return expectedCheckDigit(body) === Number(check) ? `${body}${check}` : null;
}

export function normalizeBarcode(
  raw: string,
  formatHint?: BarcodeFormat,
): NormalizedBarcode | null {
  const value = raw.replace(/\s+/g, '');
  if (!/^\d+$/.test(value)) return null;
  const format =
    formatHint ?? (value.length === 8 ? 'ean8' : value.length === 12 ? 'upc_a' : 'ean13');

  if (format === 'upc_e') {
    const expanded = expandUpcE(value);
    if (!expanded) return null;
    return {
      value: value as Barcode,
      format,
      canonicalKey: `gtin:${expanded.padStart(13, '0')}`,
    };
  }

  const expectedLength = format === 'ean8' ? 8 : format === 'upc_a' ? 12 : 13;
  if (value.length !== expectedLength || !hasValidGtinCheckDigit(value)) return null;
  return {
    value: value as Barcode,
    format,
    canonicalKey: `gtin:${format === 'upc_a' ? value.padStart(13, '0') : value}`,
  };
}
