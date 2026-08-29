import { render } from '@testing-library/react-native';
import { CalorieRing } from './NutritionVisuals';

jest.mock('@/theme/theme', () => ({
  useAppTheme: () => ({
    accent: '#28785F',
    accentStrong: '#1E5B47',
    accentSoft: '#D8EEE6',
    surfaceMuted: '#E8EDE9',
    text: '#16211C',
    textMuted: '#68736D',
    warning: '#A56A24',
  }),
}));

test('rounds calorie accessibility values to native integer bounds', () => {
  const screen = render(<CalorieRing value={1283.4} target={2000.6} label="consumed" />);
  const progress = screen.UNSAFE_getByProps({ accessibilityRole: 'progressbar' });

  expect(progress.props.accessibilityValue).toEqual({
    min: 0,
    now: 1283,
    max: 2001,
  });
});
