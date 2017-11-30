import program from 'commander';
import fs from 'fs';
import yaml from 'js-yaml';

const jsonRead = path => JSON.parse(fs.readFileSync(path, 'utf8'));

const yamlRead = path => yaml.safeLoad(fs.readFileSync(path, 'utf8'));

const read = (path) => {
  if (path.endsWith('json')) return jsonRead(path);
  if (path.endsWith('yml')) return yamlRead(path);
  throw new Error(`File ${path} can not be parsed!`);
};

const walker = (before, after, func) => {
  const unionKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  unionKeys.forEach((key) => {
    func(key, before[key], after[key]);
  });
};

const toView = view =>
  `{${view.reduce((acc, val) => `${acc}\n  ${val}`, '')}\n}`;

const gendiff = (firstConfig, secondConfig) => {
  const before = read(firstConfig);
  const after = read(secondConfig);

  const result = [];
  walker(before, after, (key, bvalue, avalue) => {
    if (bvalue === avalue) {
      result.push(`  ${key}: ${bvalue}`);
    } else if (typeof bvalue === 'undefined') {
      result.push(`+ ${key}: ${avalue}`);
    } else if (typeof avalue === 'undefined') {
      result.push(`- ${key}: ${bvalue}`);
    } else {
      result.push(`+ ${key}: ${avalue}`);
      result.push(`- ${key}: ${bvalue}`);
    }
  });

  return toView(result);
};

export const arrDiff = (arr1, arr2) => arr1.filter(x => arr2.indexOf(x) === -1);

const gendiffCommander = () => {
  program
    .version('0.0.1')
    .arguments('<firstConfig> <secondConfig>')
    .description('Compares two configuration files and shows a difference.')
    .option('-f, --format [type]', 'Output format')
    .action((firstConfig, secondConfig, options) => {
      gendiff(firstConfig, secondConfig, options.format);
    });

  program.parse(process.argv);
};

export { gendiffCommander };
export default gendiff;
