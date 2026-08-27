import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Field, Screen } from '@/components/ui';
import { useFitnessService } from '@/providers/servicesContext';
import { parseDecimalInput } from '@/domain/numericInput';
import { normalizeBarcode } from '@/domain/barcode';
import type { BarcodeFormat } from '@/domain/types';

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
  const { id, barcode, barcodeFormat, fromAddFood, mealType, localDate } = useLocalSearchParams<{
    id?: string;
    barcode?: string;
    barcodeFormat?: string;
    fromAddFood?: string;
    mealType?: string;
    localDate?: string;
  }>();
  const numberIs = (value: string, positive: boolean) => {
    const parsed = parseDecimalInput(value);
    return parsed !== null && (positive ? parsed > 0 : parsed >= 0);
  };
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('onboarding.required')),
        brand: z.string(),
        servingDescription: z.string().trim().min(1, t('onboarding.required')),
        servingGrams: z.string().refine((v) => numberIs(v, true), t('onboarding.positive')),
        calories: z.string().refine((v) => numberIs(v, false), t('onboarding.positive')),
        protein: z.string().refine((v) => v === '' || numberIs(v, false), t('onboarding.positive')),
        carbs: z.string().refine((v) => v === '' || numberIs(v, false), t('onboarding.positive')),
        fat: z.string().refine((v) => v === '' || numberIs(v, false), t('onboarding.positive')),
        fiber: z.string().refine((v) => v === '' || numberIs(v, false), t('onboarding.positive')),
        sodium: z.string().refine((v) => v === '' || numberIs(v, false), t('onboarding.positive')),
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
            protein: item.serving.knownNutrients.proteinG ? String(item.serving.proteinG) : '',
            carbs: item.serving.knownNutrients.carbsG ? String(item.serving.carbsG) : '',
            fat: item.serving.knownNutrients.fatG ? String(item.serving.fatG) : '',
            fiber: item.serving.knownNutrients.fiberG ? String(item.serving.fiberG) : '',
            sodium: item.serving.knownNutrients.sodiumMg ? String(item.serving.sodiumMg ?? '') : '',
          });
      });
  }, [id, reset, service]);
  const submit = handleSubmit(async (values) => {
    const parsedBarcode =
      barcode && ['ean13', 'ean8', 'upc_a', 'upc_e'].includes(barcodeFormat ?? '')
        ? normalizeBarcode(barcode, barcodeFormat as BarcodeFormat)
        : barcode
          ? normalizeBarcode(barcode)
          : null;
    const protein = parseDecimalInput(values.protein);
    const carbs = parseDecimalInput(values.carbs);
    const fat = parseDecimalInput(values.fat);
    const fiber = parseDecimalInput(values.fiber);
    const sodium = parseDecimalInput(values.sodium);
    const draft = {
      name: values.name,
      brand: values.brand || null,
      servingDescription: values.servingDescription,
      servingGrams: parseDecimalInput(values.servingGrams) as number,
      calories: parseDecimalInput(values.calories) as number,
      proteinG: protein ?? 0,
      carbsG: carbs ?? 0,
      fatG: fat ?? 0,
      fiberG: fiber ?? 0,
      sodiumMg: sodium,
      knownNutrients: {
        calories: true,
        proteinG: protein !== null,
        carbsG: carbs !== null,
        fatG: fat !== null,
        fiberG: fiber !== null,
        sodiumMg: sodium !== null,
      },
      barcode: parsedBarcode,
    };
    if (id) {
      await service.updateFood(id, draft);
      router.back();
    } else {
      const food = await service.createFood(draft);
      if (fromAddFood === '1') {
        router.replace({
          pathname: '/add-food',
          params: { mealType, localDate, selectedId: food.food.id },
        });
      } else {
        router.back();
      }
    }
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
      {id ? (
        <Button
          label={t('food.archiveAction')}
          variant="danger"
          onPress={() =>
            Alert.alert(t('food.archiveTitle'), t('food.archiveBody'), [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('food.archiveAction'),
                style: 'destructive',
                onPress: () => void service.archiveFood(id).then(() => router.back()),
              },
            ])
          }
        />
      ) : null}
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
