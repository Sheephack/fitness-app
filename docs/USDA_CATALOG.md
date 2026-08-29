# USDA Foundation Foods catalog

Release 1.2 includes a small offline catalog built from USDA FoodData Central Foundation Foods JSON, release `2026-04-30`.

- Nutrition values and FDC identifiers are copied from USDA records per 100 g.
- The catalog currently contains 56 deliberately selected foods. The target was approximately 80, but redundant or low-utility records were omitted in favor of a useful everyday set.
- English and Spanish display names plus search aliases are local editorial metadata. They do not modify USDA nutrition values or identifiers.
- The app seeds the catalog locally and idempotently. It makes no runtime request to USDA and works offline.
- A food can have an unknown nutrient where the Foundation record does not provide that nutrient. The UI preserves that uncertainty instead of treating it as a verified zero.

Source: https://fdc.nal.usda.gov/download-datasets/
