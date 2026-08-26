import { plannedMigrationVersions } from './migrations';

describe('migration plan', () => {
  test('applies v1 exactly once', () => {
    expect(plannedMigrationVersions(0)).toEqual([1]);
    expect(plannedMigrationVersions(1)).toEqual([]);
    expect(plannedMigrationVersions(2)).toEqual([]);
  });
});
