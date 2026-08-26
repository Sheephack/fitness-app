# Fitness App

A calm, local-first nutrition and weight companion focused on answering: **what should I do next today?** Release 0 and Release 1 provide private onboarding, manual nutrition goals, custom foods, a daily journal, deterministic balance guidance, and weight trends.

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

## Localization

Spanish and English are supported from first launch. Interface language, locale, and metric/imperial units are separate preferences. Visible copy and Daily Balance output are localized from semantic keys.

## Roadmap

Only Release 0 and Release 1 are implemented. See [docs/ROADMAP.md](docs/ROADMAP.md) for later ideas and prerequisites.

## Dependency status

`expo-doctor` passes all SDK compatibility checks. The SDK 54 dependency tree currently reports transitive npm advisories in Metro/build tooling whose automated fix upgrades Expo to SDK 57. Do not apply `npm audit fix --force`; resolve them during the planned SDK upgrade after Release 1 validation.
