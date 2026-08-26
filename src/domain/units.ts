import type { UnitSystem } from './types';

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export function kgToDisplay(weightKg: number, units: UnitSystem): number {
  return units === 'metric' ? weightKg : weightKg / KG_PER_LB;
}

export function displayToKg(weight: number, units: UnitSystem): number {
  return units === 'metric' ? weight : weight * KG_PER_LB;
}

export function cmToDisplay(heightCm: number, units: UnitSystem): number {
  return units === 'metric' ? heightCm : heightCm / CM_PER_INCH;
}

export function displayToCm(height: number, units: UnitSystem): number {
  return units === 'metric' ? height : height * CM_PER_INCH;
}

export function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
