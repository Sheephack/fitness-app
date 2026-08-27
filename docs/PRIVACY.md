# Privacy

- Essential features work offline and require no account.
- Profile, nutrition and weight data remain in the device SQLite database.
- No health analytics, ads, crash payloads containing health fields, or silent network transfer are implemented.
- Web is a visibly labeled in-memory preview and is not a persistence target.
- For a barcode not already stored locally, the app may request Open Food Facts v3. That request contains only the barcode, selected product fields, and an app user agent. It never includes nickname, age, profile, weight, goals, journal entries, or Health data.
- Imported product details are saved only to local SQLite after the user reviews and confirms them. There is no analytics, tracking, image download, or write request to Open Food Facts. Product data can be incomplete or incorrect, so the review screen exposes unknown values and requires a valid gram-based calorie value.
- Unknown nutrients are not converted into dietary advice: the app displays available totals but withholds Daily Balance and next-move guidance until the calories and required macros are known.
- Open Food Facts data is available under the [Open Database License](https://opendatacommons.org/licenses/odbl/) and its [Database Contents License](https://opendatacommons.org/licenses/dbcl/1-0/); product images are not requested or stored. This app identifies Open Food Facts in the review flow. See [Open Food Facts API documentation](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/) for current terms and limits.
- Full reset deletes profile, goals, weights, foods, logs and meal templates after confirmation.
- Export, encrypted backup, synchronization, AI and HealthKit are not implemented.

The current database relies on the operating system application sandbox. App-level SQLCipher and encrypted backup require a separate threat model, key lifecycle and native development build before implementation.
