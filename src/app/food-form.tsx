import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Field, Screen } from '@/components/ui';
import { useFitnessService } from '@/providers/servicesContext';

interface FoodForm {
  name: string;
  brand: string;
  servingDescription: string;
  servingGrams: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
}

export default function FoodFormScreen() {
  const { t } = useTranslation();
  const { service } = useFitnessService();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('onboarding.required')),
        brand: z.string(),
        servingDescription: z.string().trim().min(1, t('onboarding.required')),
        servingGrams: z.string().refine((v) => Number(v) > 0, t('onboarding.positive')),
        calories: z.string().refine((v) => Number(v) >= 0, t('onboarding.positive')),
        protein: z.string().refine((v) => v === '' || Number(v) >= 0, t('onboarding.positive')),
        carbs: z.string().refine((v) => v === '' || Number(v) >= 0, t('onboarding.positive')),
        fat: z.string().refine((v) => v === '' || Number(v) >= 0, t('onboarding.positive')),
        fiber: z.string().refine((v) => v === '' || Number(v) >= 0, t('onboarding.positive')),
        sodium: z.string().refine((v) => v === '' || Number(v) >= 0, t('onboarding.positive')),
      }),
    [t],
  );
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FoodForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      brand: '',
      servingDescription: '100 g',
      servingGrams: '100',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      sodium: '',
    },
  });
  useEffect(() => {
    if (id)
      service.getFood(id).then((item) => {
        if (item)
          reset({
            name: item.food.name,
            brand: item.food.brand ?? '',
            servingDescription: item.serving.description,
            servingGrams: String(item.serving.grams),
            calories: String(item.serving.calories),
            protein: String(item.serving.proteinG),
            carbs: String(item.serving.carbsG),
            fat: String(item.serving.fatG),
            fiber: String(item.serving.fiberG),
            sodium: String(item.serving.sodiumMg ?? ''),
          });
      });
  }, [id, reset, service]);
  const submit = handleSubmit(async (values) => {
    const draft = {
      name: values.name,
      brand: values.brand || null,
      servingDescription: values.servingDescription,
      servingGrams: Number(values.servingGrams),
      calories: Number(values.calories),
      proteinG: Number(values.protein || 0),
      carbsG: Number(values.carbs || 0),
      fatG: Number(values.fat || 0),
      fiberG: Number(values.fiber || 0),
      sodiumMg: values.sodium ? Number(values.sodium) : null,
    };
    if (id) await service.updateFood(id, draft);
    else await service.createFood(draft);
    router.back();
  });
  const fields: { name: keyof FoodForm; label: string }[] = [
    { name: 'name', label: t('food.name') },
    { name: 'brand', label: t('food.brand') },
    { name: 'servingDescription', label: t('food.servingDescription') },
    { name: 'servingGrams', label: t('food.servingGrams') },
    { name: 'calories', label: t('food.calories') },
    { name: 'protein', label: t('food.protein') },
    { name: 'carbs', label: t('food.carbs') },
    { name: 'fat', label: t('food.fat') },
    { name: 'fiber', label: t('food.fiber') },
    { name: 'sodium', label: t('food.sodium') },
  ];
  return (
    <Screen>
      <AppText variant="title">{id ? t('food.editTitle') : t('food.newTitle')}</AppText>
      <Card>
        {fields.map((item) => (
          <Controller
            key={item.name}
            control={control}
            name={item.name}
            render={({ field }) => (
              <Field
                label={item.label}
                keyboardType={
                  ['name', 'brand', 'servingDescription'].includes(item.name)
                    ? 'default'
                    : 'decimal-pad'
                }
                value={field.value}
                onChangeText={field.onChange}
                error={errors[item.name]?.message}
              />
            )}
          />
        ))}
      </Card>
      <Button label={t('common.save')} onPress={() => void submit()} loading={isSubmitting} />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
