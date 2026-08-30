import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFitnessService } from '@/providers/servicesContext';
import { useAppTheme } from '@/theme/theme';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const theme = useAppTheme();
  const { previewMode } = useFitnessService();
  const { t } = useTranslation();
  const content = (
    <View style={[styles.screenContent, { backgroundColor: theme.background }]}>
      {previewMode ? (
        <View style={[styles.preview, { backgroundColor: theme.warning }]}>
          <Text style={styles.previewText}>{t('common.preview')}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function AppText({
  children,
  variant = 'body',
  muted = false,
  style,
}: {
  children: ReactNode;
  variant?: 'display' | 'title' | 'subtitle' | 'body' | 'label' | 'caption';
  muted?: boolean;
  style?: object;
}) {
  const theme = useAppTheme();
  return (
    <Text style={[styles[variant], { color: muted ? theme.textMuted : theme.text }, style]}>
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useAppTheme();
  const background =
    variant === 'primary'
      ? theme.accent
      : variant === 'danger'
        ? theme.danger
        : variant === 'secondary'
          ? theme.surfaceMuted
          : 'transparent';
  const color =
    variant === 'primary' ? theme.accentOn : variant === 'danger' ? '#FFFFFF' : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor: variant === 'ghost' ? 'transparent' : theme.border,
          shadowColor: variant === 'primary' ? theme.accent : 'transparent',
          shadowOpacity: variant === 'primary' ? 0.48 : 0,
          shadowRadius: variant === 'primary' ? 15 : 0,
          shadowOffset: { width: 0, height: 6 },
          elevation: variant === 'primary' ? 6 : 0,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.buttonText, { color }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  keyboardType,
  ...inputProps
}: TextInputProps & {
  label: string;
  error?: string | undefined;
  keyboardType?: KeyboardTypeOptions;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.fieldWrap}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...inputProps}
        keyboardType={keyboardType}
        placeholderTextColor={theme.textMuted}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: error ? theme.danger : theme.border,
            backgroundColor: theme.surface,
          },
        ]}
      />
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function ChoiceRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.choiceRow}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.choice,
              {
                backgroundColor: selected ? theme.accentSoft : theme.surfaceRaised,
                borderColor: selected ? theme.accentStrong : theme.border,
              },
            ]}
          >
            <Text style={[styles.choiceText, { color: theme.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const theme = useAppTheme();
  const safeValue = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeValue * 100) }}
      style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}
    >
      <View
        style={[
          styles.progressFill,
          { width: `${safeValue * 100}%`, backgroundColor: theme.accent },
        ]}
      />
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="label" muted>
        {title}
      </AppText>
      {action}
    </View>
  );
}

export function InlineNotice({
  children,
  tone = 'neutral',
}: PropsWithChildren<{ tone?: 'neutral' | 'success' | 'warning' | 'danger' }>) {
  const theme = useAppTheme();
  const color =
    tone === 'success'
      ? theme.accent
      : tone === 'warning'
        ? theme.warning
        : tone === 'danger'
          ? theme.danger
          : theme.border;
  return (
    <View accessibilityRole="alert" style={[styles.notice, { borderColor: color }]}>
      <AppText>{children}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  screenContent: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 40, gap: 18 },
  preview: { marginHorizontal: -18, paddingVertical: 7, paddingHorizontal: 18 },
  previewText: { color: '#FFFFFF', textAlign: 'center', fontSize: 12, fontWeight: '700' },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 16, gap: 10 },
  display: { fontSize: 36, lineHeight: 42, fontWeight: '700', letterSpacing: -0.9 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: 0.45 },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  button: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  fieldWrap: { gap: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  error: { fontSize: 13 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 46,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  choiceText: { fontSize: 14, fontWeight: '600' },
  progressTrack: { height: 7, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  notice: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
