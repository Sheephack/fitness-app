import type { Settings, SupportedLanguage, UnitSystem } from '@/domain/types';

const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM']);

export function resolveInitialSettings(
  languageCode: string | null,
  languageTag: string | null,
  regionCode: string | null,
): Settings {
  const language: SupportedLanguage = languageCode?.toLowerCase().startsWith('es') ? 'es' : 'en';
  const unitSystem: UnitSystem =
    regionCode && IMPERIAL_REGIONS.has(regionCode) ? 'imperial' : 'metric';
  return {
    language,
    locale: languageTag ?? (language === 'es' ? 'es-AR' : 'en-US'),
    unitSystem,
    onboardingCompleted: false,
  };
}
