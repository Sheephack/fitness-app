# Release 1.1 Acceptance Checklist

Use an iPhone with Expo Go. Record the device, iOS version, app language, unit system, and any console error before marking this release accepted.

## Required flow

1. [ ] Open the app with existing data.
2. [ ] Open Journal.
3. [ ] Tap **Add food**.
4. [ ] See Search, Scan, Recent, Favorites, and Saved meals.
5. [ ] Open the scanner.
6. [ ] Grant camera permission.
7. [ ] Scan a valid EAN/UPC.
8. [ ] Confirm local lookup occurs first.
9. [ ] On a local miss, permit remote lookup.
10. [ ] See a found product for review.
11. [ ] See available nutrition clearly.
12. [ ] Correct any field if needed.
13. [ ] Save it locally.
14. [ ] Log it to a meal.
15. [ ] See meal calories/macros update.
16. [ ] Scan the same product again.
17. [ ] Confirm it resolves from SQLite with networking disabled.
18. [ ] Scan a barcode that does not exist.
19. [ ] See manual-creation fallback.
20. [ ] Create the food manually while preserving its barcode.
21. [ ] Re-scan it and confirm local resolution.
22. [ ] Use existing products without connectivity.
23. [ ] Use Recent.
24. [ ] Use Favorites.
25. [ ] Duplicate a prior meal when one exists.
26. [ ] Save and log a reusable meal.
27. [ ] Confirm the compact Journal hierarchy.
28. [ ] Switch ES/EN and confirm all new copy is translated.
29. [ ] Check light/dark, Dynamic Type, VoiceOver, touch targets, comma/period decimals, and camera-denied manual fallback.
30. [ ] Fully close the app.
31. [ ] Reopen it.
32. [ ] Confirm complete persistence of settings, foods, imported metadata, favorites, and logs.

## Release gates

- [ ] No relevant Metro/Expo console errors during the flow.
- [ ] Run `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:ci`, `npm run doctor`, and `npm run bundle:ios`.
- [ ] Record separately: Expo Go verified, iOS JavaScript bundle generated, and independent/TestFlight build not verified.

Do not mark Release 1.1 complete until every applicable item passes or a documented issue has an explicit product decision.
