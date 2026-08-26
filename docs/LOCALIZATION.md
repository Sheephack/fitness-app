# Localization

Spanish and English resources live in `src/i18n/locales/es` and `src/i18n/locales/en`. Unsupported device languages fall back to English.

Language, locale and units are independent:

- language chooses interface copy;
- locale formats dates and numbers;
- units control metric/imperial display while stored values remain canonical.

Domain rules return semantic codes such as `low_protein` or `fat_near_upper`. Presentation translates those codes and interpolates quantities. Do not construct full user-facing sentences in domain or database code. Layouts must tolerate longer translated strings and Dynamic Type.
