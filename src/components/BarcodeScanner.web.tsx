import { useTranslation } from 'react-i18next';
import type { BarcodeFormat } from '@/domain/types';
import { AppText, Card } from './ui';

export interface BarcodeScannerProps {
  locked: boolean;
  onDetected: (value: string, format: BarcodeFormat) => void;
}

export function BarcodeScanner() {
  const { t } = useTranslation();
  return (
    <Card>
      <AppText variant="subtitle">{t('scanner.webTitle')}</AppText>
      <AppText muted>{t('scanner.webBody')}</AppText>
    </Card>
  );
}
