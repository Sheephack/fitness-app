# Roadmap

## Current

Release 0 and Release 1 are implemented. Release 1.1 adds a local-first barcode-first flow: camera/manual EAN/UPC input, local cache resolution, user-reviewed Open Food Facts imports, compact meals, recents, favorites, saved meals, and quantity previews. Its final gate is a physical iPhone Expo Go scan, local re-scan while offline, reopen persistence, and both ES/EN themes.

## Later, not implemented

- **Release 2:** adaptive nutrition targets and micronutrients.
- **Release 3:** workouts, exercise history and progressive overload.
- **Release 4:** optional, granular HealthKit integration.
- **Release 5:** consent-based personal coach receiving structured summaries only.
- **Release 6:** food price and nutrition-cost analysis.

Before HealthKit or TestFlight, upgrade from SDK 54 to the then-current Expo SDK, introduce an Expo Development Build, verify current Apple requirements, and obtain an Apple Developer membership. Cloud or self-hosted synchronization must remain optional; local data stays authoritative.
