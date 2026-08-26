# Repository Guidelines

## Project Structure & Module Organization

Treat `Prompt Codex — App Local-First de Fitness y Nutrición.md` as the product brief. Routes live in `src/app/`, primitives in `src/components/`, pure rules in `src/domain/`, use cases and ports in `src/application/`, SQLite adapters in `src/db/`, and translations in `src/i18n/locales/{es,en}/`. Store static files in `assets/`, decisions in `docs/`, and tests beside their source.

`src/domain` must never import React, Expo, routing, styling, localization, or SQLite. Screens consume hooks/services and never execute SQL. Release 0 and Release 1 are the active scope.

## Build, Test, and Development Commands

- `npm install` — install locked dependencies.
- `npm run start` — start the Expo development server.
- `npm run web` — open the non-persistent UI preview.
- `npm run lint` — run ESLint without automatic fixes in CI.
- `npm run typecheck` — run TypeScript in strict mode.
- `npm run test:ci` — execute unit and integration tests once.
- `npm run bundle:ios` — verify that the iOS JavaScript bundle exports.

Explain each new dependency and identify packages that introduce native code.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, semicolons, Prettier, and ESLint. Name components and domain types in `PascalCase`, hooks as `useThing`, functions and variables in `camelCase`, and true constants in `UPPER_SNAKE_CASE`. Prefer small modules, pure functions, explicit types, and validated inputs. Use translation keys for all visible copy.

## Testing Guidelines

Name tests `*.test.ts` or `*.test.tsx`. Cover nutrition totals, ranges, weight trends, migrations, and every Daily Balance Engine rule with deterministic unit tests. Add focused flow tests for onboarding, food logging, persistence, and language switching. No blanket coverage target applies; critical calculations must cover boundaries and invalid inputs.

## Commit & Pull Request Guidelines

Use Conventional Commits, for example `feat(nutrition): add macro range evaluation`. Keep commits focused. Pull requests must describe the outcome, list validation commands, link issues, flag schema or native dependency changes, and include screenshots for affected languages and themes.

## Security & Privacy

Treat profile, weight, and nutrition data as sensitive. Keep essential flows offline, never commit secrets or real health data, and do not send health fields to analytics, crash reports, or external services without explicit consent.
