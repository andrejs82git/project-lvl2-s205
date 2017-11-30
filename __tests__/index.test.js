import fs from 'fs';
import gendiff, { arrDiff } from '../src';

const fixture = './__tests__/__fixtures__/';

test('gendiff json', () => {
  const diff = fs.readFileSync(`${fixture}/result.txt`, 'utf8').trim();
  expect(gendiff(`${fixture}/before.json`, `${fixture}/after.json`)).toBe(diff);
});

test('gendiff yaml', () => {
  const diff = fs.readFileSync(`${fixture}/result.txt`, 'utf8').trim();
  expect(gendiff(`${fixture}/before.yml`, `${fixture}/after.yml`)).toBe(diff);
});

test('arrDiff', () => {
  expect(arrDiff([1, 2, 3], [2, 3])).toEqual([1]);
});
