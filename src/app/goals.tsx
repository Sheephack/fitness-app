import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Field, Screen } from '@/components/ui';
import { useFitnessService } from '@/providers/servicesContext';

type RangeName = 'protein' | 'carbs' | 'fat' | 'fiber';
interface GoalForm {
  calories: string;
  proteinMin: string;
  proteinMax: string;
  carbsMin: string;
  carbsMax: string;
  fatMin: string;
  fatMax: string;
  fiberMin: string;
  fiberMax: string;
}

export default function GoalsScreen() {
  const { t } = useTranslation();
  const { service } = useFitnessService();
  const schema = useMemo(
    () =>
      z
        .object({
          calories: z.string().refine((v) => Number(v) > 0, t('onboarding.positive')),
          proteinMin: z.string(),
          proteinMax: z.string(),
          carbsMin: z.string(),
          carbsMax: z.string(),
          fatMin: z.string(),
          fatMax: z.string(),
          fiberMin: z.string(),
          fiberMax: z.string(),
        })
        .superRefine((data, ctx) => {
          for (const name of ['protein', 'carbs', 'fat', 'fiber'] as RangeName[]) {
            const min = Number(data[`${name}Min` as keyof GoalForm]);
            const max = Number(data[`${name}Max` as keyof GoalForm]);
            if (!Number.isFinite(min) || min < 0)
              ctx.addIssue({
                code: 'custom',
                path: [`${name}Min`],
                message: t('onboarding.positive'),
              });
            if (!Number.isFinite(max) || max < min)
              ctx.addIssue({
                code: 'custom',
                path: [`${name}Max`],
                message: t('goals.invalidRange'),
              });
          }
        }),
    [t],
  );
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      calories: '2200',
      proteinMin: '120',
      proteinMax: '140',
      carbsMin: '180',
      carbsMax: '230',
      fatMin: '55',
      fatMax: '70',
      fiberMin: '25',
      fiberMax: '35',
    },
  });
  useEffect(() => {
    service.getNutritionGoals().then((goals) => {
      if (goals)
        reset({
          calories: String(goals.caloriesTarget),
          proteinMin: String(goals.protein.min),
          proteinMax: String(goals.protein.max),
          carbsMin: String(goals.carbs.min),
          carbsMax: String(goals.carbs.max),
          fatMin: String(goals.fat.min),
          fatMax: String(goals.fat.max),
          fiberMin: String(goals.fiber.min),
          fiberMax: String(goals.fiber.max),
        });
    });
  }, [reset, service]);
  const submit = handleSubmit(async (values) => {
    await service.saveNutritionGoals({
      caloriesTarget: Number(values.calories),
      protein: { min: Number(values.proteinMin), max: Number(values.proteinMax) },
      carbs: { min: Number(values.carbsMin), max: Number(values.carbsMax) },
      fat: { min: Number(values.fatMin), max: Number(values.fatMax) },
      fiber: { min: Number(values.fiberMin), max: Number(values.fiberMax) },
    });
    router.back();
  });
  return (
    <Screen>
      <AppText variant="title">{t('goals.title')}</AppText>
      <AppText muted>{t('goals.subtitle')}</AppText>
      <Card>
        <Controller
          control={control}
          name="calories"
          render={({ field }) => (
            <Field
              label={t('goals.calories')}
              keyboardType="number-pad"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.calories?.message}
            />
          )}
        />
      </Card>
      {(['protein', 'carbs', 'fat', 'fiber'] as RangeName[]).map((name) => (
        <Card key={name}>
          <AppText variant="subtitle">{t(`goals.${name}`)}</AppText>
          <Controller
            control={control}
            name={`${name}Min`}
            render={({ field }) => (
              <Field
                label={t('goals.minimum')}
                keyboardType="decimal-pad"
                value={field.value}
                onChangeText={field.onChange}
                error={errors[`${name}Min`]?.message}
              />
            )}
          />
          <Controller
            control={control}
            name={`${name}Max`}
            render={({ field }) => (
              <Field
                label={t('goals.maximum')}
                keyboardType="decimal-pad"
                value={field.value}
                onChangeText={field.onChange}
                error={errors[`${name}Max`]?.message}
              />
            )}
          />
        </Card>
      ))}
      <Button label={t('common.save')} onPress={() => void submit()} loading={isSubmitting} />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
