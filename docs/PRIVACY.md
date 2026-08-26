# Privacy

- Essential features work offline and require no account.
- Profile, nutrition and weight data remain in the device SQLite database.
- No health analytics, ads, crash payloads containing health fields, or silent network transfer are implemented.
- Web is a visibly labeled in-memory preview and is not a persistence target.
- Full reset deletes profile, goals, weights, foods, logs and meal templates after confirmation.
- Export, encrypted backup, synchronization, AI and HealthKit are not implemented.

The current database relies on the operating system application sandbox. App-level SQLCipher and encrypted backup require a separate threat model, key lifecycle and native development build before implementation.
