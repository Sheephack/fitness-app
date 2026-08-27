# Architecture

## Boundaries

- `src/domain`: pure entities, `LocalDate`, units, nutrition totals, balance and weight math.
- `src/application`: repository/clock/ID/provider contracts, `BarcodeResolver`, and orchestration through `FitnessService`.
- `src/db`: Expo SQLite migration and adapters; in-memory development adapter for web/tests.
- `src/integrations`: replaceable external adapters, currently `OpenFoodFactsProvider`.
- `src/app` and `src/components`: replaceable presentation and navigation.

Domain and application contracts have no dependency on React, Expo Router, styles or SQLite. Native composition binds SQLite repositories; web development binds memory repositories and makes non-persistence visible.

## Data decisions

Canonical units are kg, cm, g, mg and kcal. Events store UTC instants plus an explicit local `YYYY-MM-DD`. Journal queries and “yesterday” operate on `LocalDate`, never UTC day boundaries.

Food logs snapshot serving text, nutrients, and nutrient availability. Editing or archiving food therefore never rewrites history. Imported foods retain a normalized barcode, external metadata, review status, and a local searchable copy; a barcode lookup always checks SQLite before its provider. SQLite v2 is additive: it preserves v1 rows, marks their nutrients as complete, and allows a barcode to be reused after archiving.

Open Food Facts data is normalized outside domain code. The adapter maps only explicitly available nutrients, prefers a 100 g base, converts kJ only as an explicit calorie fallback and sodium g to mg. Products without a real gram basis must be corrected before import; milliliters never imply a density. The domain scales approved servings or grams and reports partial totals when nutrients are unknown. It does not generate Daily Balance or next-move guidance until calories and every balance macro are known.

## Error and transaction policy

User inputs are validated before repository calls and SQL binds all user values. Multi-row meal operations run in transactions. The resolver deduplicates concurrent remote lookup promises; UI camera state is ephemeral and is not part of persistence. Reset requires explicit confirmation and recreates only detected default settings.
