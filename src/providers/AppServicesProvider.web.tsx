import { useMemo, type PropsWithChildren } from 'react';
import { getLocales } from 'expo-localization';
import { resolveInitialSettings } from '@/application/devicePreferences';
import { BarcodeResolver } from '@/application/BarcodeResolver';
import { createMemoryAppServices } from '@/db/memoryRepositories';
import { OpenFoodFactsProvider } from '@/integrations/OpenFoodFactsProvider';
import { ServicesContext } from './servicesContext';

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
  return (
    <ServicesContext.Provider value={{ ...services, previewMode: true }}>
      {children}
    </ServicesContext.Provider>
  );
}
