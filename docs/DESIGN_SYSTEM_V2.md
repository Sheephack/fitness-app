# Design System V2

Release 1.2 bis is a dark-first native interface for fast daily nutrition tracking. It preserves the local-first model and system typography while replacing the previous jade/charcoal visual language with a layered midnight-blue instrument panel.

## Tokens

- Ink: `#080B17` is the primary dark canvas. Surfaces step through deep navy rather than neutral gray so hierarchy remains visible in dark mode.
- Accent: electric violet `#7C3AED`; its light companion is `#B388FF`. Cyan, turquoise, amber and magenta identify data families, never a control by color alone.
- Text: cold white primary text, blue-gray secondary text and a dedicated tonal-surface text role. Critical dark and light pairs are covered by automated AA contrast tests.
- Shape: 14–18 point radii and narrow blue borders. Strong glow is reserved for the active navigation state, primary actions and selected chart data.
- Type: the platform system family. Large numeric values use tabular figures; labels are compact and functional. Dynamic Type is not capped.

## Composition

- Home starts with a welcome, then a single layered energy panel with an SVG ring and an explicit remaining-energy strip. Every ring has only a neutral track, a low-opacity full target arc and a solid consumed arc from 12 o’clock. Macro progress is measured toward the maximum of its displayed range; the full text below keeps the minimum and maximum explicit. The next decision is editorial and may use the local unbranded recommendation image; the action remains a direct food registration.
- Journal is organized around a horizontally scrollable orbital meal rail. Exactly one meal surface is active at once, holding its summary, dense food rows, contextual actions and the add-food control. Empty meals no longer reserve tall tiles.
- Weight uses a responsive heading, functional Trend/Summary/Statistics tabs and a central, measurable SVG chart. It keeps point selection and its 44 point hit targets. The trend panel uses an area tone and a cyan target line only when the target belongs to the visible value scale; an off-scale target remains explicit in the metric strip rather than being visually falsified.
- Quick actions form an accessible radial orbit of existing actions. The user’s handedness preference continues to choose its anchor side.

## Editorial assets and iconography

- `assets/images/nutrition/next-meal.png` is a generated, unbranded editorial recommendation illustration.
- `assets/images/nutrition/oats.png` is shown only for an oatmeal/avena match. Other catalog, personal or imported foods use the outline category icon rather than a potentially misleading image.
- The interface uses the existing Expo Ionicons family. No decorative hand-drawn icon system or new native package is introduced.

## Accessibility and motion

- Interactive controls remain at least 44 points. The meal rail has 52 point circular targets and scrolls horizontally at large type instead of shrinking labels.
- Active states combine shape, position, border/underline and text treatment with color.
- Motion is limited to press feedback and modal transitions. Chart overlays remain tied to measured SVG coordinates.
