import { useColorScheme } from 'react-native';

const shared = {
  accent: '#28785F',
  accentSoft: '#D8EEE6',
  warning: '#A56A24',
  danger: '#A2433B',
  radius: { sm: 10, md: 16, lg: 24, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
};

export const lightTheme = {
  ...shared,
  background: '#F3F6F2',
  surface: '#FFFFFF',
  surfaceMuted: '#E8EDE9',
  text: '#16211C',
  textMuted: '#68736D',
  border: '#D9E0DB',
  tab: '#FFFFFF',
};

export const darkTheme = {
  ...shared,
  accent: '#70C5A6',
  accentSoft: '#173D31',
  background: '#0D1310',
  surface: '#171F1B',
  surfaceMuted: '#222C27',
  text: '#F0F5F2',
  textMuted: '#A7B2AC',
  border: '#303B35',
  tab: '#131A17',
};

export type AppTheme = typeof lightTheme;

export function useAppTheme(): AppTheme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
