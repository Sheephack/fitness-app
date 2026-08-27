import { plannedMigrationVersions } from './migrations';

describe('migration plan', () => {
  test('plans additive v1 then v2 migrations exactly once', () => {
    expect(plannedMigrationVersions(0)).toEqual([1, 2]);
    expect(plannedMigrationVersions(1)).toEqual([2]);
    expect(plannedMigrationVersions(2)).toEqual([]);
  });
});
