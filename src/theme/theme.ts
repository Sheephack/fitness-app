import { useColorScheme } from 'react-native';

const shared = {
  accent: '#28785F',
  accentSoft: '#D8EEE6',
  accentStrong: '#1E5B47',
  accentInk: '#0E3226',
  info: '#3B6E9A',
  warning: '#A56A24',
  danger: '#A2433B',
  radius: { xs: 8, sm: 12, md: 18, lg: 26, pill: 999 },
  spacing: { xxs: 2, xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 },
  shadow: { color: '#0B2218', opacity: 0.1, radius: 18, elevation: 3 },
};

export const lightTheme = {
  ...shared,
  background: '#F3F6F2',
  surface: '#FFFFFF',
  surfaceMuted: '#E8EDE9',
  surfaceAccent: '#E3F2EC',
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
  surfaceAccent: '#173D31',
  text: '#F0F5F2',
  textMuted: '#A7B2AC',
  border: '#303B35',
  tab: '#131A17',
};

export type AppTheme = typeof lightTheme;

export function useAppTheme(): AppTheme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
