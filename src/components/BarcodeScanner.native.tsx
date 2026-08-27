import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import type { BarcodeFormat } from '@/domain/types';
import { AppText, Button, Card } from './ui';
import { useAppTheme } from '@/theme/theme';

export interface BarcodeScannerProps {
  locked: boolean;
  onDetected: (value: string, format: BarcodeFormat) => void;
}

const SUPPORTED = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export function BarcodeScanner({ locked, onDetected }: BarcodeScannerProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [mountError, setMountError] = useState(false);
  const [ready, setReady] = useState(false);

  if (!permission) {
    return (
      <Card>
        <AppText>{t('scanner.permissionChecking')}</AppText>
      </Card>
    );
  }
  if (!permission.granted) {
    return (
      <Card>
        <AppText variant="subtitle">{t('scanner.permissionTitle')}</AppText>
        <AppText muted>
          {permission.canAskAgain ? t('scanner.permissionBody') : t('scanner.permissionDeniedBody')}
        </AppText>
        {permission.canAskAgain ? (
          <Button label={t('scanner.allowCamera')} onPress={() => void requestPermission()} />
        ) : (
          <Button
            label={t('scanner.openSettings')}
            variant="secondary"
            onPress={() => void Linking.openSettings()}
          />
        )}
      </Card>
    );
  }
  if (mountError) {
    return (
      <Card>
        <AppText variant="subtitle">{t('scanner.unavailableTitle')}</AppText>
        <AppText muted>{t('scanner.unavailableBody')}</AppText>
      </Card>
    );
  }
  const detected = (result: BarcodeScanningResult) => {
    if (locked || !SUPPORTED.includes(result.type as (typeof SUPPORTED)[number])) return;
    onDetected(result.data, result.type as BarcodeFormat);
  };
  return (
    <View
      accessibilityLabel={t('scanner.cameraLabel')}
      style={[styles.frame, { borderColor: locked ? theme.accent : theme.border }]}
    >
      <CameraView
        active={!locked}
        facing="back"
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: [...SUPPORTED] }}
        onBarcodeScanned={locked ? undefined : detected}
        onCameraReady={() => setReady(true)}
        onMountError={() => setMountError(true)}
      />
      <View pointerEvents="none" style={styles.overlay}>
        <View style={[styles.guide, { borderColor: locked ? theme.accent : '#FFFFFF' }]} />
        <AppText style={styles.help}>
          {locked ? t('scanner.detected') : ready ? t('scanner.aim') : t('common.loading')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 320,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#101010',
  },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  guide: { width: '78%', height: 130, borderWidth: 3, borderRadius: 16 },
  help: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.68)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
});
