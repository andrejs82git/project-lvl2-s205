import program from 'commander';
import fs from 'fs';

const walker = (before, after, func) => {
  const unionKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  console.log(unionKeys);
  unionKeys.forEach((key) => {
    func(key, before[key], after[key]);
  });
};

const toView = view =>
  `{${view.reduce((acc, val) => `${acc}\n  ${val}`, '')}\n}`;

const gendiff = (firstConfig, secondConfig) => {
  const before = JSON.parse(fs.readFileSync(firstConfig, 'utf8'));
  const after = JSON.parse(fs.readFileSync(secondConfig, 'utf8'));

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
