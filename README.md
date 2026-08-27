# Fitness App

A calm, local-first nutrition and weight companion focused on answering: **what should I do next today?** Release 1.1 adds fast food logging: compact meals, recents, favorites, saved meals, barcode scanning, and an optional Open Food Facts lookup.

## Architecture

The UI depends on application use cases and repository interfaces. Domain code is framework-independent, while `src/db/` implements persistence with Expo SQLite. Food-log entries store nutrient snapshots so later food edits never rewrite history. Daily data is keyed by an explicit local `YYYY-MM-DD` date.

```text
UI / Expo Router → application use cases → domain + repository ports ← SQLite adapters
```

## Requirements

- Node.js LTS and npm
- Expo Go compatible with Expo SDK 54 on an iPhone
- Windows, macOS, or Linux development machine

## Setup and commands

```powershell
npm install
npm run start
```

Scan the QR code with Expo Go. If the phone cannot reach the development server, run `npx expo start --tunnel`.

- `npm run web`: auxiliary, non-persistent UI preview.
- `npm run lint`: static lint checks.
- `npm run format:check`: verify repository formatting.
- `npm run typecheck`: strict TypeScript verification.
- `npm run test:ci`: deterministic test suite.
- `npm run doctor`: Expo dependency/configuration health.
- `npm run bundle:ios`: JavaScript bundle export; not an independent signed iOS build.

## Local storage and privacy

Native data stays in `fitness-app.db` through `expo-sqlite`. There is no account, backend, analytics, advertising, or silent upload. Web intentionally uses an in-memory preview adapter and displays that limitation.

When a new EAN/UPC barcode is scanned, the app checks local SQLite first. Only a local miss calls Open Food Facts v3 with the barcode, selected product fields, and an identifiable app user agent. A product is never stored automatically: the user reviews it first. Once saved, it is local and works offline. Read the data and attribution limits in [docs/PRIVACY.md](docs/PRIVACY.md).

`expo-camera ~17.0.10` is the only new runtime dependency in 0.1.1. It adds native camera/barcode support for iPhone Expo Go; the web preview retains manual barcode input and does not require browser camera support.

## Localization

Spanish and English are supported from first launch. Interface language, locale, and metric/imperial units are separate preferences. Visible copy and Daily Balance output are localized from semantic keys.

## Roadmap

Release 0, Release 1, and the Release 1.1 fast-logging pass are implemented in code. Physical iPhone scanner/cache acceptance remains a manual validation gate. See [docs/ROADMAP.md](docs/ROADMAP.md) for later ideas and prerequisites.

Use [the Release 1.1 acceptance checklist](docs/ACCEPTANCE_RELEASE_1_1.md) for the final Expo Go pass.

## Dependency status

`expo-doctor` passes all SDK compatibility checks. The SDK 54 dependency tree currently reports transitive npm advisories in Metro/build tooling whose automated fix upgrades Expo to SDK 57. Do not apply `npm audit fix --force`; resolve them during the planned SDK upgrade after Release 1 validation.
