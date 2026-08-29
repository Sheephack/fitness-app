import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/theme';
import { useFitnessService } from '@/providers/servicesContext';

export function QuickMenu() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { service } = useFitnessService();
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('right');
  useEffect(() => {
    void service.getLoggingPreferences().then((preferences) => setSide(preferences.quickMenuSide));
  }, [service, open]);
  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };
  const actions = [
    {
      label: t('foodPicker.scan'),
      icon: 'barcode-outline' as const,
      onPress: () =>
        router.push({ pathname: '/add-food', params: { start: 'scanner', express: '1' } }),
    },
    {
      label: t('foodPicker.search'),
      icon: 'search-outline' as const,
      onPress: () => router.push('/add-food'),
    },
    {
      label: t('home.logWeight'),
      icon: 'scale-outline' as const,
      onPress: () => router.push('/(tabs)/weight'),
    },
    {
      label: t('journal.addFood'),
      icon: 'add-circle-outline' as const,
      onPress: () => router.push('/quick-add' as never),
    },
  ];
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('quickMenu.open')}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          setOpen(true);
        }}
        style={[
          styles.fab as ViewStyle,
          {
            backgroundColor: theme.accent,
            shadowColor: theme.shadow.color,
            left: side === 'left' ? 20 : undefined,
            right: side === 'right' ? 20 : undefined,
          },
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('quickMenu.close')}
          style={styles.backdrop as ViewStyle}
          onPress={() => setOpen(false)}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet as ViewStyle,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.shadow.color,
            },
          ]}
        >
          <View style={[styles.handle as ViewStyle, { backgroundColor: theme.border }]} />
          <Text style={[styles.title as TextStyle, { color: theme.text }]}>
            {t('quickMenu.title')}
          </Text>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={() => choose(action.onPress)}
              style={({ pressed }) => [
                styles.action as ViewStyle,
                { backgroundColor: pressed ? theme.surfaceMuted : theme.surfaceAccent },
              ]}
            >
              <Ionicons name={action.icon} size={22} color={theme.accentStrong} />
              <Text style={[styles.actionLabel as TextStyle, { color: theme.text }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 76,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 18, 13, 0.32)' },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 26,
    padding: 18,
    gap: 10,
    elevation: 8,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 4, marginBottom: 2 },
  title: { fontSize: 19, fontWeight: '700', marginBottom: 4 },
  action: {
    minHeight: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  actionLabel: { fontSize: 16, fontWeight: '600' },
});
