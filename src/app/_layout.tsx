import { Stack } from 'expo-router';
import { I18nextProvider } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { AppServicesProvider } from '@/providers/AppServicesProvider';
import { i18n } from '@/i18n';
import { useAppTheme } from '@/theme/theme';

function Navigation() {
  const theme = useAppTheme();
  return (
    <>
      <StatusBar style={theme.background === '#0D1310' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="goals" options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen name="food-form" options={{ presentation: 'modal', title: '' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <AppServicesProvider>
        <Navigation />
      </AppServicesProvider>
    </I18nextProvider>
  );
}
