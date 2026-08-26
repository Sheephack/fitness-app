import { useMemo, type PropsWithChildren } from 'react';
import { getLocales } from 'expo-localization';
import { resolveInitialSettings } from '@/application/devicePreferences';
import { createMemoryFitnessService } from '@/db/memoryRepositories';
import { ServicesContext } from './servicesContext';

export function AppServicesProvider({ children }: PropsWithChildren) {
  const service = useMemo(() => {
    const locale = getLocales()[0];
    return createMemoryFitnessService(
      resolveInitialSettings(
        locale?.languageCode ?? null,
        locale?.languageTag ?? null,
        locale?.regionCode ?? null,
      ),
    );
  }, []);
  return (
    <ServicesContext.Provider value={{ service, previewMode: true }}>
      {children}
    </ServicesContext.Provider>
  );
}
