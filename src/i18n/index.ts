import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { en } from './locales/en';
import { es } from './locales/es';

const deviceLanguage = getLocales()[0]?.languageCode?.toLowerCase().startsWith('es') ? 'es' : 'en';
const i18n = createInstance();

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: { es: { translation: es }, en: { translation: en } },
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
