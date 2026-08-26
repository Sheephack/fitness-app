import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { i18n } from '@/i18n';
import { resolveInitialSettings } from '@/application/devicePreferences';
import { AppText, Button, Card, ChoiceRow, Screen, SectionHeader } from '@/components/ui';
import type { Profile, Settings, SupportedLanguage, UnitSystem } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { service } = useFitnessService();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const load = useCallback(() => {
    Promise.all([service.getSettings(), service.getProfile()]).then(([value, user]) => {
      setSettings(value);
      setProfile(user);
    });
  }, [service]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  if (!settings)
    return (
      <Screen>
        <AppText>{t('common.loading')}</AppText>
      </Screen>
    );
  const language = async (value: SupportedLanguage) => {
    await service.setLanguage(value);
    await i18n.changeLanguage(value);
    load();
  };
  const units = async (value: UnitSystem) => {
    await service.setUnitSystem(value);
    load();
  };
  const reset = () =>
    Alert.alert(t('settings.resetTitle'), t('settings.resetBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.resetConfirm'),
        style: 'destructive',
        onPress: () => {
          const locale = getLocales()[0];
          const defaults = resolveInitialSettings(
            locale?.languageCode ?? null,
            locale?.languageTag ?? null,
            locale?.regionCode ?? null,
          );
          void service.resetAll(defaults).then(() => {
            void i18n.changeLanguage(defaults.language);
            router.replace('/onboarding');
          });
        },
      },
    ]);
  return (
    <Screen>
      <AppText variant="display">{t('settings.title')}</AppText>
      <SectionHeader title={t('settings.profile')} />
      <Card>
        <AppText variant="title">{profile?.nickname}</AppText>
        <Button
          label={t('settings.editProfile')}
          variant="secondary"
          onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })}
        />
        <Button
          label={t('settings.nutritionGoals')}
          variant="secondary"
          onPress={() => router.push('/goals')}
        />
      </Card>
      <SectionHeader title={t('settings.language')} />
      <Card>
        <ChoiceRow
          value={settings.language}
          onChange={(value) => void language(value)}
          options={[
            { value: 'es', label: t('settings.spanish') },
            { value: 'en', label: t('settings.english') },
          ]}
        />
      </Card>
      <SectionHeader title={t('settings.units')} />
      <Card>
        <ChoiceRow
          value={settings.unitSystem}
          onChange={(value) => void units(value)}
          options={[
            { value: 'metric', label: t('onboarding.metric') },
            { value: 'imperial', label: t('onboarding.imperial') },
          ]}
        />
      </Card>
      <SectionHeader title={t('settings.privacy')} />
      <Card>
        <AppText>{t('settings.privacyBody')}</AppText>
      </Card>
      <Button
        label={`${t('settings.export')} · ${t('common.comingSoon')}`}
        variant="secondary"
        disabled
        onPress={() => {}}
      />
      <Button label={t('settings.reset')} variant="danger" onPress={reset} />
    </Screen>
  );
}
