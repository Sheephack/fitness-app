import { normalizeFoodSearch } from '@/domain/nutrition';

test('deduplicates editorial aliases using their SQLite normalized value', () => {
  const aliases = ['Salmón', 'Salmon', 'salmón'];
  const unique = aliases.filter(
    (value, index, all) =>
      all.findIndex(
        (candidate) => normalizeFoodSearch(candidate) === normalizeFoodSearch(value),
      ) === index,
  );
  expect(unique).toEqual(['Salmón']);
});
