import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { getLocales } from 'expo-localization';
import { FitnessService } from '@/application/FitnessService';
import { resolveInitialSettings } from '@/application/devicePreferences';
import { SystemClock } from '@/application/systemClock';
import { migrateDatabase } from '@/db/migrations';
import { createSqliteRepositories, SqliteIdGenerator } from '@/db/sqliteRepositories';
import { ServicesContext } from './servicesContext';

function Bootstrap({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const service = useMemo(
    () =>
      new FitnessService(
        createSqliteRepositories(db),
        new SqliteIdGenerator(db),
        new SystemClock(),
      ),
    [db],
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const locale = getLocales()[0];
    service
      .initializeSettings(
        resolveInitialSettings(
          locale?.languageCode ?? null,
          locale?.languageTag ?? null,
          locale?.regionCode ?? null,
        ),
      )
      .then(() => setReady(true));
  }, [service]);
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <ServicesContext.Provider value={{ service, previewMode: false }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function AppServicesProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName="fitness-app.db" onInit={migrateDatabase}>
      <Bootstrap>{children}</Bootstrap>
    </SQLiteProvider>
  );
}
