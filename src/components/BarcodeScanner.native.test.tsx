import { fireEvent, render } from '@testing-library/react-native';
import { i18n } from '@/i18n';
import { BarcodeScanner } from './BarcodeScanner.native';

let mockPermission: { granted: boolean; canAskAgain: boolean } | null = null;
const mockRequestPermission = jest.fn();

jest.mock('expo-camera', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    CameraView: (props: { active?: boolean; onBarcodeScanned?: unknown }) =>
      React.createElement(View, {
        testID: 'camera',
        accessibilityLabel: props.onBarcodeScanned ? 'scanning' : 'paused',
        accessibilityState: { disabled: !props.active },
      }),
    useCameraPermissions: () => [mockPermission, mockRequestPermission],
  };
});

describe('BarcodeScanner', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockRequestPermission.mockReset();
  });

  test('keeps manual fallback available when camera permission is denied', () => {
    mockPermission = { granted: false, canAskAgain: true };
    const view = render(<BarcodeScanner locked={false} onDetected={jest.fn()} />);
    fireEvent.press(view.getByRole('button', { name: 'Allow camera' }));
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  test('disables barcode callbacks immediately while a valid code is resolving', () => {
    mockPermission = { granted: true, canAskAgain: true };
    const view = render(<BarcodeScanner locked onDetected={jest.fn()} />);
    expect(view.getByLabelText('paused')).toBeTruthy();
    expect(view.getByText('Barcode detected')).toBeTruthy();
  });
});
