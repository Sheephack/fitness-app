# Implementation Plan

## Active scope

Build and stabilize Release 0 and Release 1 only: onboarding, local profile/settings, nutrition goals, custom foods, daily journal, reusable meals, weight tracking, deterministic balance guidance, accessibility, and ES/EN localization.

## Dependency direction

`domain` is pure. `application` owns use cases and repository ports. `db` adapts those ports to SQLite. React screens only call application services. This boundary makes UI and navigation replaceable without changing business rules or persistence.

## Delivery gates

1. Strict TypeScript scaffold, migrations, composition root and real onboarding.
2. Release 0 persistence, settings, language/unit changes, reset and iPhone reopen check.
3. CI plus Release 1 nutrition/weight flows and domain tests.
4. Full acceptance pass in Expo Go, followed by documented defects and only then future SDK work.

## Explicit non-goals

Android, cloud sync, AI, HealthKit, barcode scanning, automatic TDEE targets, payments, web publication, and Releases 2–6.
