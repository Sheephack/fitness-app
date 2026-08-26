import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { i18n } from '@/i18n';
import { useFitnessService } from '@/providers/servicesContext';

export default function IndexScreen() {
  const { service } = useFitnessService();
  const [complete, setComplete] = useState<boolean | null>(null);
  useEffect(() => {
    service.getSettings().then((settings) => {
      if (settings) void i18n.changeLanguage(settings.language);
      setComplete(settings?.onboardingCompleted ?? false);
    });
  }, [service]);
  if (complete === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={complete ? '/(tabs)' : '/onboarding'} />;
}
