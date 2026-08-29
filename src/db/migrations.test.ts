import { plannedMigrationVersions } from './migrations';

describe('migration plan', () => {
  test('plans additive v1 through v4 migrations exactly once', () => {
    expect(plannedMigrationVersions(0)).toEqual([1, 2, 3, 4]);
    expect(plannedMigrationVersions(1)).toEqual([2, 3, 4]);
    expect(plannedMigrationVersions(2)).toEqual([3, 4]);
    expect(plannedMigrationVersions(3)).toEqual([4]);
    expect(plannedMigrationVersions(4)).toEqual([]);
  });
});
