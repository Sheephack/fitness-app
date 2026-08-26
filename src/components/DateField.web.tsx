import { Field } from './ui';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  return (
    <Field
      label={label}
      value={value}
      placeholder={t('onboarding.dateHint')}
      autoCapitalize="none"
      onChangeText={onChange}
      error={error}
    />
  );
}
