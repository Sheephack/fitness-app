import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/theme';
import { QuickMenu } from '@/components/QuickMenu';

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarStyle: {
            backgroundColor: theme.tab,
            borderTopColor: theme.border,
            height: 68,
            paddingBottom: 8,
            paddingTop: 5,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="today-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: t('tabs.journal'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="weight"
          options={{
            title: t('tabs.weight'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-down-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
      <QuickMenu />
    </>
  );
}
