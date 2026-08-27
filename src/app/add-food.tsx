import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ExternalFoodProduct } from '@/application/ports';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { AppText, Button, Card, ChoiceRow, Field, InlineNotice, Screen } from '@/components/ui';
import { localDateFromDate, parseLocalDate } from '@/domain/localDate';
import { parseDecimalInput } from '@/domain/numericInput';
import { normalizeBarcode } from '@/domain/barcode';
import { resolveLogQuantity } from '@/domain/nutrition';
import type {
  BarcodeFormat,
  FoodDraft,
  FoodWithServing,
  LocalDate,
  MealTemplate,
  MealType,
  NormalizedBarcode,
  NutritionAvailability,
} from '@/domain/types';
import { useFitnessService } from '@/providers/servicesContext';
import { useAppTheme } from '@/theme/theme';

type PickerMode = 'search' | 'recent' | 'favorites' | 'templates';
type Step = 'picker' | 'scanner' | 'review' | 'quantity';

interface ReviewForm {
  name: string;
  brand: string;
  serving: string;
  grams: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
}

function candidateForm(product: ExternalFoodProduct): ReviewForm {
  const visible = (key: keyof NutritionAvailability, value: number | null) =>
    product.knownNutrients[key] && value !== null ? String(Math.round(value * 100) / 100) : '';
  return {
    name: product.name ?? '',
    brand: product.brand ?? '',
    serving: product.servingDescription ?? '',
    grams: product.servingGrams ? String(product.servingGrams) : '',
    calories: visible('calories', product.nutrition.calories),
    protein: visible('proteinG', product.nutrition.proteinG),
    carbs: visible('carbsG', product.nutrition.carbsG),
    fat: visible('fatG', product.nutrition.fatG),
    fiber: visible('fiberG', product.nutrition.fiberG),
    sodium: visible('sodiumMg', product.nutrition.sodiumMg),
  };
}

export default function AddFoodScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { service, barcodeResolver } = useFitnessService();
  const params = useLocalSearchParams<{
    mealType?: string;
    localDate?: string;
    selectedId?: string;
  }>();
  const mealType = (
    ['breakfast', 'lunch', 'snack', 'dinner', 'other'].includes(params.mealType ?? '')
      ? params.mealType
      : 'breakfast'
  ) as MealType;
  const localDate: LocalDate = params.localDate
    ? parseLocalDate(params.localDate)
    : localDateFromDate(new Date());

  const [step, setStep] = useState<Step>('picker');
  const [mode, setMode] = useState<PickerMode>('recent');
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<FoodWithServing[]>([]);
  const [recent, setRecent] = useState<FoodWithServing[]>([]);
  const [favorites, setFavorites] = useState<FoodWithServing[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [selected, setSelected] = useState<FoodWithServing | null>(null);
  const [candidate, setCandidate] = useState<ExternalFoodProduct | null>(null);
  const [review, setReview] = useState<ReviewForm | null>(null);
  const [reviewDirty, setReviewDirty] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [fallbackBarcode, setFallbackBarcode] = useState<NormalizedBarcode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'neutral' | 'success' | 'warning' | 'danger'>(
    'neutral',
  );
  const [quantityMode, setQuantityMode] = useState<'servings' | 'grams'>('servings');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  const loadCollections = useCallback(() => {
    Promise.all([
      service.listRecentFoods(12),
      service.listFavoriteFoods(12),
      service.listMealTemplates(),
    ]).then(([nextRecent, nextFavorites, nextTemplates]) => {
      setRecent(nextRecent);
      setFavorites(nextFavorites);
      setTemplates(nextTemplates);
    });
  }, [service]);
  useFocusEffect(useCallback(loadCollections, [loadCollections]));
  useEffect(() => {
    if (mode !== 'search') return;
    void service.listFoods(query).then(setFoods);
  }, [mode, query, service]);
  useEffect(() => {
    if (!params.selectedId) return;
    void service.getFood(params.selectedId).then((food) => {
      if (food) {
        setSelected(food);
        setStep('quantity');
      }
    });
  }, [params.selectedId, service]);

  const choose = (food: FoodWithServing) => {
    setSelected(food);
    setQuantityMode('servings');
    setQuantity('1');
    setStep('quantity');
  };

  const resolveBarcode = async (raw: string, format?: BarcodeFormat) => {
    const normalized = normalizeBarcode(raw, format);
    if (!normalized) {
      setNotice(t('scanner.invalid'));
      setNoticeTone('warning');
      return;
    }
    setScanLocked(true);
    setNotice(t('scanner.resolving'));
    setNoticeTone('neutral');
    const result = await barcodeResolver.resolve(normalized.value, normalized.format);
    if (result.kind === 'local') {
      setNotice(t('scanner.foundLocal'));
      setNoticeTone('success');
      choose(result.food);
      return;
    }
    if (result.kind === 'remote') {
      setCandidate(result.product);
      setReview(candidateForm(result.product));
      setReviewDirty(false);
      setNotice(t('scanner.foundRemote'));
      setNoticeTone('success');
      setStep('review');
      return;
    }
    if (result.kind === 'not_found') {
      setManualBarcode(result.barcode.value);
      setFallbackBarcode(result.barcode);
      setNotice(t('scanner.notFound'));
      setNoticeTone('warning');
    } else if (result.kind === 'offline') {
      setManualBarcode(result.barcode.value);
      setFallbackBarcode(result.barcode);
      setNotice(t('scanner.offline'));
      setNoticeTone('warning');
    } else {
      setManualBarcode(raw);
      setNotice(t('scanner.temporaryError'));
      setNoticeTone('danger');
    }
  };

  const openManual = (barcode = fallbackBarcode ?? normalizeBarcode(manualBarcode)) => {
    router.push({
      pathname: '/food-form',
      params: {
        mealType,
        localDate,
        barcode: barcode?.value,
        barcodeFormat: barcode?.format,
        barcodeKey: barcode?.canonicalKey,
        fromAddFood: '1',
      },
    });
  };

  const updateReview = (key: keyof ReviewForm, value: string) => {
    setReview((current) => (current ? { ...current, [key]: value } : current));
    setReviewDirty(true);
  };

  const saveReview = async () => {
    if (!review || !candidate) return;
    const grams = parseDecimalInput(review.grams);
    const calories = parseDecimalInput(review.calories);
    if (!review.name.trim() || !grams || grams <= 0 || calories === null || calories < 0) {
      setNotice(t('food.reviewRequired'));
      setNoticeTone('warning');
      return;
    }
    const nutrient = (value: string) => {
      const parsed = parseDecimalInput(value);
      return parsed !== null && parsed >= 0 ? parsed : null;
    };
    const protein = nutrient(review.protein);
    const carbs = nutrient(review.carbs);
    const fat = nutrient(review.fat);
    const fiber = nutrient(review.fiber);
    const sodium = nutrient(review.sodium);
    const draft: FoodDraft = {
      name: review.name,
      brand: review.brand || null,
      servingDescription: review.serving.trim() || `${grams} g`,
      servingGrams: grams,
      calories,
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
    };
    setSaving(true);
    try {
      const food = await service.importExternalFood(candidate, draft, reviewDirty);
      setSelected(food);
      setNotice(t('food.imported'));
      setNoticeTone('success');
      setStep('quantity');
    } finally {
      setSaving(false);
    }
  };

  const quantityInput = useMemo(() => {
    const value = parseDecimalInput(quantity);
    if (!selected || value === null || value <= 0) return null;
    return quantityMode === 'servings'
      ? ({ kind: 'servings', count: value } as const)
      : ({ kind: 'grams', grams: value } as const);
  }, [quantity, quantityMode, selected]);
  const preview =
    selected && quantityInput ? resolveLogQuantity(selected.serving, quantityInput) : null;

  const logSelected = async () => {
    if (!selected || !quantityInput) return;
    setSaving(true);
    try {
      await service.logFoodQuantity(selected, mealType, quantityInput, localDate);
      router.replace({
        pathname: '/(tabs)/journal',
        params: { feedback: 'food_logged' },
      });
    } finally {
      setSaving(false);
    }
  };

  const resetScan = () => {
    setScanLocked(false);
    setNotice(null);
    setManualBarcode('');
    setFallbackBarcode(null);
  };

  const list =
    mode === 'search' ? foods : mode === 'recent' ? recent : mode === 'favorites' ? favorites : [];

  return (
    <Screen>
      <AppText variant="title">{t('foodPicker.title')}</AppText>
      <AppText muted>{t('foodPicker.destination', { meal: t(`journal.${mealType}`) })}</AppText>
      {notice ? <InlineNotice tone={noticeTone}>{notice}</InlineNotice> : null}

      {step === 'picker' ? (
        <>
          <ChoiceRow
            value={mode}
            onChange={setMode}
            options={[
              { value: 'search', label: t('foodPicker.search') },
              { value: 'recent', label: t('foodPicker.recent') },
              { value: 'favorites', label: t('foodPicker.favorites') },
              { value: 'templates', label: t('foodPicker.savedMeals') },
            ]}
          />
          <Button
            label={t('foodPicker.scan')}
            onPress={() => {
              setStep('scanner');
              resetScan();
            }}
          />
          {mode === 'search' ? (
            <Field
              label={t('journal.search')}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
          ) : null}
          {mode === 'templates' ? (
            templates.length ? (
              templates.map((template) => (
                <Card key={template.id}>
                  <AppText variant="subtitle">{template.name}</AppText>
                  <AppText muted>
                    {t('journal.itemCount', { count: template.items.length })}
                  </AppText>
                  <Button
                    label={t('journal.logMeal')}
                    variant="secondary"
                    onPress={() => {
                      void service.logMealTemplate(template, mealType).then(() =>
                        router.replace({
                          pathname: '/(tabs)/journal',
                          params: { feedback: 'meal_logged' },
                        }),
                      );
                    }}
                  />
                </Card>
              ))
            ) : (
              <Card>
                <AppText muted>{t('foodPicker.noSavedMeals')}</AppText>
              </Card>
            )
          ) : list.length ? (
            list.map((food) => (
              <Card key={food.food.id} style={styles.foodCard}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => choose(food)}
                  style={styles.foodRow}
                >
                  <View style={styles.grow}>
                    <AppText variant="subtitle">{food.food.name}</AppText>
                    <AppText variant="caption" muted>
                      {food.food.brand ? `${food.food.brand} · ` : ''}
                      {food.serving.description} · {Math.round(food.serving.calories)} kcal
                    </AppText>
                  </View>
                  <AppText>{food.food.isFavorite ? '★' : '›'}</AppText>
                </Pressable>
                <View style={styles.rowActions}>
                  <Button
                    label={
                      food.food.isFavorite ? t('foodPicker.unfavorite') : t('foodPicker.favorite')
                    }
                    variant="ghost"
                    onPress={() => void service.toggleFavorite(food).then(loadCollections)}
                  />
                  <Button
                    label={t('common.edit')}
                    variant="ghost"
                    onPress={() =>
                      router.push({ pathname: '/food-form', params: { id: food.food.id } })
                    }
                  />
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <AppText muted>{t('foodPicker.empty')}</AppText>
            </Card>
          )}
          <Button label={t('foodPicker.manual')} variant="ghost" onPress={() => openManual()} />
          <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
        </>
      ) : null}

      {step === 'scanner' ? (
        <>
          <BarcodeScanner
            locked={scanLocked}
            onDetected={(value, format) => void resolveBarcode(value, format)}
          />
          <Field
            label={t('scanner.manualLabel')}
            keyboardType="number-pad"
            value={manualBarcode}
            onChangeText={(value) => {
              setManualBarcode(value);
              setFallbackBarcode(null);
            }}
          />
          <Button
            label={t('scanner.lookup')}
            variant="secondary"
            disabled={!manualBarcode.trim() || scanLocked}
            onPress={() => void resolveBarcode(manualBarcode)}
          />
          {scanLocked ? (
            <Button label={t('scanner.scanAgain')} variant="secondary" onPress={resetScan} />
          ) : null}
          {manualBarcode ? (
            <Button label={t('foodPicker.manual')} variant="ghost" onPress={() => openManual()} />
          ) : null}
          <Button label={t('common.back')} variant="ghost" onPress={() => setStep('picker')} />
        </>
      ) : null}

      {step === 'review' && review && candidate ? (
        <>
          <Card>
            <AppText variant="subtitle">{t('food.reviewTitle')}</AppText>
            <AppText muted>{t('food.externalSource')}</AppText>
            {candidate.basis === 'unsupported_volume' || candidate.basis === 'unknown' ? (
              <InlineNotice tone="warning">{t('food.unsupportedBasis')}</InlineNotice>
            ) : null}
            {(
              [
                ['name', t('food.name')],
                ['brand', t('food.brand')],
                ['serving', t('food.servingDescription')],
                ['grams', t('food.servingGrams')],
                ['calories', t('food.calories')],
                ['protein', t('food.protein')],
                ['carbs', t('food.carbs')],
                ['fat', t('food.fat')],
                ['fiber', t('food.fiber')],
                ['sodium', t('food.sodium')],
              ] as [keyof ReviewForm, string][]
            ).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={review[key]}
                keyboardType={
                  ['name', 'brand', 'serving'].includes(key) ? 'default' : 'decimal-pad'
                }
                placeholder={
                  ['name', 'grams', 'calories'].includes(key)
                    ? t('food.required')
                    : t('food.unknown')
                }
                onChangeText={(value) => updateReview(key, value)}
              />
            ))}
          </Card>
          <Button
            label={t('food.confirmImport')}
            loading={saving}
            onPress={() => void saveReview()}
          />
          <Button
            label={t('foodPicker.manual')}
            variant="secondary"
            onPress={() => {
              openManual(candidate.barcode);
            }}
          />
          <Button label={t('common.cancel')} variant="ghost" onPress={() => setStep('picker')} />
        </>
      ) : null}

      {step === 'quantity' && selected ? (
        <>
          <Card>
            <AppText variant="title">{selected.food.name}</AppText>
            {selected.food.brand ? <AppText muted>{selected.food.brand}</AppText> : null}
            <ChoiceRow
              value={quantityMode}
              onChange={(value) => {
                setQuantityMode(value);
                setQuantity(value === 'servings' ? '1' : '100');
              }}
              options={[
                { value: 'servings', label: t('quantity.servings') },
                { value: 'grams', label: t('quantity.grams') },
              ]}
            />
            <View style={styles.presets}>
              {(quantityMode === 'servings' ? ['1', '1.5'] : ['50', '100']).map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  onPress={() => setQuantity(value)}
                  style={[
                    styles.preset,
                    { borderColor: quantity === value ? theme.accent : theme.border },
                  ]}
                >
                  <AppText>{quantityMode === 'grams' ? `${value} g` : value}</AppText>
                </Pressable>
              ))}
            </View>
            <Field
              label={quantityMode === 'servings' ? t('quantity.count') : t('quantity.grams')}
              keyboardType="decimal-pad"
              value={quantity}
              onChangeText={setQuantity}
            />
          </Card>
          {preview ? (
            <Card>
              <AppText variant="subtitle">
                {t('quantity.preview', { grams: Math.round(preview.grams) })}
              </AppText>
              <AppText variant="title">{Math.round(preview.values.calories)} kcal</AppText>
              <AppText muted>
                {t('quantity.macros', {
                  protein: Math.round(preview.values.proteinG * 10) / 10,
                  carbs: Math.round(preview.values.carbsG * 10) / 10,
                  fat: Math.round(preview.values.fatG * 10) / 10,
                })}
              </AppText>
              {Object.values(selected.serving.knownNutrients).some((known) => !known) ? (
                <AppText variant="caption" muted>
                  {t('quantity.partial')}
                </AppText>
              ) : null}
            </Card>
          ) : (
            <InlineNotice tone="warning">{t('quantity.invalid')}</InlineNotice>
          )}
          <Button
            label={t('journal.addToJournal')}
            loading={saving}
            disabled={!preview}
            onPress={() => void logSelected()}
          />
          <Button label={t('common.back')} variant="ghost" onPress={() => setStep('picker')} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  foodCard: { paddingVertical: 12 },
  foodRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
  },
});
