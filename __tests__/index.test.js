import fs from 'fs';
import gendiff, { arrDiff, getFileExt, unique } from '../src';

const fixture = './__tests__/__fixtures__';
const fixtureRecurion = './__tests__/__fixtures__/recursion';

test('gendiff json', () => {
  const diff = fs.readFileSync(`${fixture}/result.txt`, 'utf8').trim();
  expect(gendiff(`${fixture}/before.json`, `${fixture}/after.json`)).toBe(diff);
});

test('gendiff json recursion', () => {
  const diff = fs.readFileSync(`${fixtureRecurion}/result.txt`, 'utf8').trim();
  expect(gendiff(`${fixtureRecurion}/before.json`, `${fixtureRecurion}/after.json`)).toBe(diff);
});

test('gendiff yaml', () => {
  const diff = fs.readFileSync(`${fixture}/result.txt`, 'utf8').trim();
  expect(gendiff(`${fixture}/before.yml`, `${fixture}/after.yml`)).toBe(diff);
});

test('gendiff yaml recurion', () => {
  const diff = fs.readFileSync(`${fixtureRecurion}/result.txt`, 'utf8').trim();
  expect(gendiff(`${fixtureRecurion}/before.yml`, `${fixtureRecurion}/after.yml`)).toBe(diff);
});

test('gendiff ini', () => {
  const diff = fs.readFileSync(`${fixture}/result.txt`, 'utf8').trim();
  expect(gendiff(`${fixture}/before.ini`, `${fixture}/after.ini`)).toBe(diff);
});

test('gendiff ini recursion', () => {
  const diff = fs.readFileSync(`${fixtureRecurion}/result.txt`, 'utf8').trim();
  expect(gendiff(`${fixtureRecurion}/before.ini`, `${fixtureRecurion}/after.ini`)).toBe(diff);
});

test('get extension of file', () => {
  expect(getFileExt('/asd/a/sdf/asdfasdf.yml')).toBe('yml');
});

test('test unique array', () => {
  expect(unique([1 ,1 , 2, 2, 5, 6])).toEqual([1, 2, 5, 6]);
});

