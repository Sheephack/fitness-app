# Design System V2

Release 1.2 uses a calm, compact, single-accent native system for repeated daily actions.

## Tokens

- Accent: green, for the one primary action and positive nutrition state.
- Surfaces: quiet neutral background, raised surface only for focused input or summary groups.
- Radius: 8, 12, 18, 26, and pill. Buttons use 12 or pill; sheets and grouped summaries use 26.
- Spacing: 2, 6, 10, 16, 24, 32, 48.
- Type: platform system font, with display for a single page value, title for screen hierarchy, and label for compact controls.

## Composition

- Home uses a real energy hero, a calorie ring, and compact macro bars or rings. Macro ranges render a target zone with a separate consumed marker; they are not treated as a single percentage.
- Journal uses expandable meal groups instead of a vertical stack of equal cards. Each group keeps its add action visible and moves detail actions into an accessible editor sheet.
- Weight uses a single SVG trend surface, range controls, and concise statistics.
- The quick menu is a simple modal sheet. It does not drag or use snap physics.

## Accessibility and motion

- All actions have explicit labels and at least 44 point targets.
- Light and dark themes share semantic token names and preserve contrast.
- Motion is limited to press feedback and the quick-sheet opacity/translation transition. Reduce Motion disables the transition.
- Weight SVGs must measure their actual container and position each 44 point touch target over its corresponding point. Flexible overlay rows are not permitted over charts.
