import { useColorScheme } from 'react-native';

const shared = {
  info: '#22D3EE',
  warning: '#F59E0B',
  danger: '#F43F5E',
  success: '#22C55E',
  cyan: '#22D3EE',
  magenta: '#EC4899',
  turquoise: '#2DD4BF',
  amber: '#F59E0B',
  radius: { xs: 8, sm: 12, md: 16, lg: 18, pill: 999 },
  spacing: { xxs: 2, xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 },
  shadow: { color: '#02030A', opacity: 0.38, radius: 22, elevation: 6 },
};

export const lightTheme = {
  ...shared,
  isDark: false,
  accent: '#6D28D9',
  accentSoft: '#EDE9FE',
  accentStrong: '#5B21B6',
  accentInk: '#3B0764',
  accentOn: '#FFFFFF',
  background: '#F7F8FF',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#EEF1FA',
  surfaceAccent: '#F1EDFF',
  text: '#10172D',
  textMuted: '#53607A',
  textSubtle: '#6F7B93',
  textOnAccentSurface: '#2E1065',
  border: '#D9E0F0',
  borderStrong: '#B8C4DF',
  tab: '#FFFFFF',
};

export const darkTheme = {
  ...shared,
  isDark: true,
  accent: '#7C3AED',
  accentSoft: '#2E1767',
  accentStrong: '#B388FF',
  accentInk: '#EDE9FE',
  accentOn: '#FFFFFF',
  background: '#080B17',
  surface: '#0F162B',
  surfaceRaised: '#131C34',
  surfaceMuted: '#1B2543',
  surfaceAccent: '#19153A',
  text: '#F7F8FF',
  textMuted: '#B5BED2',
  textSubtle: '#8792AD',
  textOnAccentSurface: '#F2EEFF',
  border: '#273453',
  borderStrong: '#3B4C75',
  tab: '#0A1021',
};

export type AppTheme = typeof lightTheme;

export function useAppTheme(): AppTheme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
