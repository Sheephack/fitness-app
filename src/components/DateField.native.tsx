import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText } from './ui';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/theme';

export function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(1990, 0, 1);
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={[
          styles.button,
          { backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.border },
        ]}
      >
        <AppText>{value || t('onboarding.dateHint')}</AppText>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={(_, selected) => {
            if (Platform.OS !== 'ios') setOpen(false);
            if (selected) {
              const year = selected.getFullYear();
              const month = String(selected.getMonth() + 1).padStart(2, '0');
              const day = String(selected.getDate()).padStart(2, '0');
              onChange(`${year}-${month}-${day}`);
            }
          }}
        />
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Pressable onPress={() => setOpen(false)} style={styles.done}>
          <AppText variant="label" style={{ color: theme.accent }}>
            {t('common.close')}
          </AppText>
        </Pressable>
      ) : null}
      {error ? (
        <AppText variant="caption" style={{ color: theme.danger }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  done: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
});
