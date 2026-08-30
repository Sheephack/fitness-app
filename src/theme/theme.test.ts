import { darkTheme, lightTheme } from './theme';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const values = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const red = values[0] ?? 0;
  const green = values[1] ?? 0;
  const blue = values[2] ?? 0;
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  const lighter = values[0] ?? 0;
  const darker = values[1] ?? 0;
  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme contrast', () => {
  test.each([
    ['light primary text', lightTheme.text, lightTheme.background],
    ['light secondary text', lightTheme.textMuted, lightTheme.surface],
    ['light text on tonal surface', lightTheme.textOnAccentSurface, lightTheme.surfaceAccent],
    ['light primary action', lightTheme.accentOn, lightTheme.accent],
    ['dark primary text', darkTheme.text, darkTheme.background],
    ['dark secondary text', darkTheme.textMuted, darkTheme.surface],
    ['dark text on tonal surface', darkTheme.textOnAccentSurface, darkTheme.surfaceAccent],
    ['dark primary action', darkTheme.accentOn, darkTheme.accent],
  ])('%s meets AA', (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
