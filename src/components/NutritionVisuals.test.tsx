import { render } from '@testing-library/react-native';
import { Circle } from 'react-native-svg';
import { CalorieRing, MacroRangeBar, MacroRangeRing } from './NutritionVisuals';

jest.mock('@/theme/theme', () => ({
  useAppTheme: () => ({
    accent: '#28785F',
    accentStrong: '#1E5B47',
    accentSoft: '#D8EEE6',
    surfaceMuted: '#E8EDE9',
    background: '#F3F6F2',
    text: '#16211C',
    textMuted: '#68736D',
    warning: '#A56A24',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

test('describes a macro range state without relying only on color', () => {
  const screen = render(<MacroRangeBar label="Protein" value={32} known min={40} max={60} />);

  expect(screen.getByLabelText(/Protein: 32 g/)).toBeTruthy();
});

test('does not draw a consumed arc at zero energy', () => {
  const screen = render(<CalorieRing value={0} target={2200} label="consumed" />);

  expect(screen.UNSAFE_getAllByType(Circle)).toHaveLength(2);
});

test('uses the same 12 o’clock origin for macro target and consumed arcs', () => {
  const screen = render(
    <MacroRangeRing label="Protein" value={70} known min={120} max={140} color="#22D3EE" />,
  );
  const circles = screen.UNSAFE_getAllByType(Circle);

  expect(circles).toHaveLength(3);
  expect(circles[2]?.props.rotation).toBe('-90');
  expect(circles[2]?.props.origin).toBe('43, 43');
});
