import { fireEvent, render } from '@testing-library/react-native';
import { Button, Field } from './ui';

describe('UI primitives', () => {
  test('button exposes an accessible action', () => {
    const onPress = jest.fn();
    const view = render(<Button label="Guardar" onPress={onPress} />);
    fireEvent.press(view.getByRole('button', { name: 'Guardar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('field exposes its label and validation message', () => {
    const view = render(
      <Field label="Peso" value="" error="Valor inválido" onChangeText={() => {}} />,
    );
    expect(view.getByLabelText('Peso')).toBeTruthy();
    expect(view.getByText('Valor inválido')).toBeTruthy();
  });
});
