import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, ChoiceRow, Field, Screen } from '@/components/ui';
import { DateField } from '@/components/DateField';
import { parseLocalDate } from '@/domain/localDate';
import { parseDecimalInput } from '@/domain/numericInput';
import { cmToDisplay, displayToCm, displayToKg, kgToDisplay, roundTo } from '@/domain/units';
import type { ActivityLevel, GoalType, UnitSystem } from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';

interface FormValues {
  nickname: string;
  birthDate: string;
  height: string;
  currentWeight: string;
  targetWeight: string;
  units: UnitSystem;
  activity: ActivityLevel;
  goal: GoalType;
  pace: string;
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { service } = useFitnessService();
  const params = useLocalSearchParams<{ edit?: string }>();
  const editing = params.edit === '1';
  const schema = useMemo(
    () =>
      z.object({
        nickname: z.string().trim().min(1, t('onboarding.required')),
        birthDate: z.string().refine((value) => {
          try {
            parseLocalDate(value);
            return true;
          } catch {
            return false;
          }
        }, t('onboarding.invalidDate')),
        height: z
          .string()
          .refine((value) => (parseDecimalInput(value) ?? 0) > 0, t('onboarding.positive')),
        currentWeight: z
          .string()
          .refine((value) => (parseDecimalInput(value) ?? 0) > 0, t('onboarding.positive')),
        targetWeight: z
          .string()
          .refine((value) => (parseDecimalInput(value) ?? 0) > 0, t('onboarding.positive')),
        units: z.enum(['metric', 'imperial']),
        activity: z.enum(['sedentary', 'light', 'moderate', 'high']),
        goal: z.enum(['lose', 'maintain', 'gain']),
        pace: z
          .string()
          .refine(
            (value) => value.trim() === '' || (parseDecimalInput(value) ?? 0) > 0,
            t('onboarding.positive'),
          ),
      }),
    [t],
  );
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nickname: '',
      birthDate: '',
      height: '',
      currentWeight: '',
      targetWeight: '',
      units: 'metric',
      activity: 'moderate',
      goal: 'maintain',
      pace: '0.5',
    },
  });
  const units = watch('units');
  const goal = watch('goal');

  useEffect(() => {
    if (!editing) return;
    Promise.all([service.getProfile(), service.getSettings(), service.listWeights()]).then(
      ([profile, settings, weights]) => {
        if (!profile || !settings) return;
        const latest = weights.at(-1)?.weightKg ?? profile.targetWeightKg;
        reset({
          nickname: profile.nickname,
          birthDate: profile.birthDate,
          height: String(roundTo(cmToDisplay(profile.heightCm, settings.unitSystem), 1)),
          currentWeight: String(roundTo(kgToDisplay(latest, settings.unitSystem), 1)),
          targetWeight: String(
            roundTo(kgToDisplay(profile.targetWeightKg, settings.unitSystem), 1),
          ),
          units: settings.unitSystem,
          activity: profile.activityLevel,
          goal: profile.goalType,
          pace: String(
            roundTo(kgToDisplay(profile.targetPaceKgPerWeek ?? 0.5, settings.unitSystem), 2),
          ),
        });
      },
    );
  }, [editing, reset, service]);

  const changeUnits = (next: UnitSystem) => {
    const previous = getValues('units');
    if (previous === next) return;
    const convert = (
      field: 'height' | 'currentWeight' | 'targetWeight' | 'pace',
      kind: 'height' | 'weight',
    ) => {
      const raw = parseDecimalInput(getValues(field));
      if (raw === null || !Number.isFinite(raw) || raw <= 0) return;
      const canonical = kind === 'height' ? displayToCm(raw, previous) : displayToKg(raw, previous);
      const displayed =
        kind === 'height' ? cmToDisplay(canonical, next) : kgToDisplay(canonical, next);
      setValue(field, String(roundTo(displayed, kind === 'height' ? 1 : 2)));
    };
    convert('height', 'height');
    convert('currentWeight', 'weight');
    convert('targetWeight', 'weight');
    convert('pace', 'weight');
    setValue('units', next);
  };

  const submit = handleSubmit(async (values) => {
    const targetPace = parseDecimalInput(values.pace);
    await service.saveProfile(
      {
        nickname: values.nickname,
        birthDate: parseLocalDate(values.birthDate),
        heightCm: displayToCm(parseDecimalInput(values.height) as number, values.units),
        currentWeightKg: displayToKg(
          parseDecimalInput(values.currentWeight) as number,
          values.units,
        ),
        targetWeightKg: displayToKg(parseDecimalInput(values.targetWeight) as number, values.units),
        activityLevel: values.activity,
        goalType: values.goal,
        targetPaceKgPerWeek:
          values.goal === 'maintain'
            ? null
            : targetPace === null
              ? null
              : displayToKg(targetPace, values.units),
        unitSystem: values.units,
      },
      !editing,
    );
    router.replace(editing ? '/(tabs)/settings' : '/(tabs)');
  });

  return (
    <Screen>
      <AppText variant="label" muted>
        {t('onboarding.eyebrow')}
      </AppText>
      <AppText variant="display">
        {editing ? t('onboarding.editTitle') : t('onboarding.title')}
      </AppText>
      <AppText muted>{t('onboarding.subtitle')}</AppText>
      <Card>
        <Controller
          control={control}
          name="nickname"
          render={({ field }) => (
            <Field
              label={t('onboarding.nickname')}
              value={field.value}
              onChangeText={field.onChange}
              error={errors.nickname?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="birthDate"
          render={({ field }) => (
            <DateField
              label={t('onboarding.birthDate')}
              value={field.value}
              onChange={field.onChange}
              error={errors.birthDate?.message}
            />
          )}
        />
      </Card>
      <Card>
        <AppText variant="label">{t('onboarding.units')}</AppText>
        <Controller
          control={control}
          name="units"
          render={({ field }) => (
            <ChoiceRow
              value={field.value}
              onChange={changeUnits}
              options={[
                { value: 'metric', label: t('onboarding.metric') },
                { value: 'imperial', label: t('onboarding.imperial') },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="height"
          render={({ field }) => (
            <Field
              label={`${t('onboarding.height')} (${units === 'metric' ? t('common.cm') : t('common.inches')})`}
              keyboardType="decimal-pad"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.height?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="currentWeight"
          render={({ field }) => (
            <Field
              label={`${t('onboarding.currentWeight')} (${units === 'metric' ? t('common.kg') : t('common.lb')})`}
              keyboardType="decimal-pad"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.currentWeight?.message}
              editable={!editing}
            />
          )}
        />
        <Controller
          control={control}
          name="targetWeight"
          render={({ field }) => (
            <Field
              label={`${t('onboarding.targetWeight')} (${units === 'metric' ? t('common.kg') : t('common.lb')})`}
              keyboardType="decimal-pad"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.targetWeight?.message}
            />
          )}
        />
      </Card>
      <Card>
        <AppText variant="label">{t('onboarding.activity')}</AppText>
        <Controller
          control={control}
          name="activity"
          render={({ field }) => (
            <ChoiceRow
              value={field.value}
              onChange={field.onChange}
              options={(['sedentary', 'light', 'moderate', 'high'] as ActivityLevel[]).map(
                (value) => ({ value, label: t(`onboarding.${value}`) }),
              )}
            />
          )}
        />
        <AppText variant="label">{t('onboarding.goal')}</AppText>
        <Controller
          control={control}
          name="goal"
          render={({ field }) => (
            <ChoiceRow
              value={field.value}
              onChange={field.onChange}
              options={(['lose', 'maintain', 'gain'] as GoalType[]).map((value) => ({
                value,
                label: t(`onboarding.${value}`),
              }))}
            />
          )}
        />
        {goal !== 'maintain' ? (
          <Controller
            control={control}
            name="pace"
            render={({ field }) => (
              <Field
                label={`${t('onboarding.pace')} (${units === 'metric' ? t('common.kg') : t('common.lb')})`}
                keyboardType="decimal-pad"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        ) : null}
      </Card>
      <AppText variant="caption" muted>
        {t('onboarding.privacy')}
      </AppText>
      <Button label={t('common.save')} onPress={() => void submit()} loading={isSubmitting} />
      {editing ? (
        <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
      ) : null}
    </Screen>
  );
}
