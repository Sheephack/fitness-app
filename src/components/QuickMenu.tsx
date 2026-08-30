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
      bottom: 72,
      inset: 0,
      onPress: () =>
        router.push({ pathname: '/add-food', params: { start: 'scanner', express: '1' } }),
    },
    {
      label: t('foodPicker.search'),
      icon: 'search-outline' as const,
      bottom: 126,
      inset: 0,
      onPress: () => router.push('/add-food'),
    },
    {
      label: t('journal.addFood'),
      icon: 'flash-outline' as const,
      bottom: 184,
      inset: 0,
      onPress: () => router.push('/quick-add' as never),
    },
    {
      label: t('home.logWeight'),
      icon: 'scale-outline' as const,
      bottom: 244,
      inset: 0,
      onPress: () => router.push('/(tabs)/weight'),
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
            shadowColor: theme.accent,
            left: side === 'left' ? 20 : undefined,
            right: side === 'right' ? 20 : undefined,
          },
        ]}
      >
        <Ionicons name="add" size={29} color={theme.accentOn} />
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
            styles.orbit as ViewStyle,
            { left: side === 'left' ? 20 : undefined, right: side === 'right' ? 20 : undefined },
          ]}
        >
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => choose(action.onPress)}
              style={({ pressed }) => [
                styles.orbitAction as ViewStyle,
                {
                  bottom: action.bottom,
                  left: side === 'left' ? action.inset : undefined,
                  right: side === 'right' ? action.inset : undefined,
                  flexDirection: side === 'right' ? 'row-reverse' : 'row',
                  backgroundColor: theme.surface,
                  borderColor: theme.borderStrong,
                  shadowColor: theme.accent,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.actionIcon as ViewStyle,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.accentStrong,
                    shadowColor: theme.accent,
                  },
                ]}
              >
                <Ionicons name={action.icon} size={21} color={theme.accentStrong} />
              </View>
              <Text style={[styles.actionLabel as TextStyle, { color: theme.text }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('quickMenu.close')}
            onPress={() => setOpen(false)}
            style={[
              styles.center as ViewStyle,
              {
                backgroundColor: theme.accent,
                shadowColor: theme.accent,
                left: side === 'left' ? 0 : undefined,
                right: side === 'right' ? 0 : undefined,
              },
            ]}
          >
            <Ionicons name="close" size={28} color={theme.accentOn} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 76,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOpacity: 0.72,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 0 },
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,3,12,0.62)' },
  orbit: { position: 'absolute', bottom: 76, width: 184, height: 324 },
  center: {
    position: 'absolute',
    bottom: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 9,
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  orbitAction: {
    position: 'absolute',
    width: 176,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 26,
    paddingHorizontal: 4,
    elevation: 7,
    shadowOpacity: 0.46,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  actionLabel: {
    maxWidth: 112,
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
