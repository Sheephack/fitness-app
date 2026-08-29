import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getLocales } from 'expo-localization';
import { resolveInitialSettings } from '@/application/devicePreferences';
import { BarcodeResolver } from '@/application/BarcodeResolver';
import { createMemoryAppServices } from '@/db/memoryRepositories';
import { OpenFoodFactsProvider } from '@/integrations/OpenFoodFactsProvider';
import { ServicesContext } from './servicesContext';
import {
  USDA_FOUNDATION_CATALOG,
  USDA_FOUNDATION_CATALOG_KEY,
  USDA_FOUNDATION_CATALOG_VERSION,
} from '@/catalog/usdaFoundation';

export function AppServicesProvider({ children }: PropsWithChildren) {
  const services = useMemo(() => {
    const locale = getLocales()[0];
    const memory = createMemoryAppServices(
      resolveInitialSettings(
        locale?.languageCode ?? null,
        locale?.languageTag ?? null,
        locale?.regionCode ?? null,
      ),
    );
    return {
      service: memory.service,
      barcodeResolver: new BarcodeResolver(memory.repositories.foods, new OpenFoodFactsProvider()),
    };
  }, []);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void services.service
      .seedCatalog(
        USDA_FOUNDATION_CATALOG_KEY,
        USDA_FOUNDATION_CATALOG_VERSION,
        USDA_FOUNDATION_CATALOG,
      )
      .then(() => setReady(true));
  }, [services]);
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <ServicesContext.Provider value={{ ...services, previewMode: true }}>
      {children}
    </ServicesContext.Provider>
  );
}
