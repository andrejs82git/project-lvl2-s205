import program from 'commander';
import fs from 'fs';
import yaml from 'js-yaml';
import ini from 'ini';

export const getFileExt = path => path.split('.').pop();
export const unique = array =>
  array.filter((item, pos, arr) => arr.indexOf(item) === pos);


const read = (path) => {
  const readers = {
    json: p => JSON.parse(fs.readFileSync(p, 'utf8')),
    yml: p => yaml.safeLoad(fs.readFileSync(p, 'utf8')),
    ini: p => ini.parse(fs.readFileSync(p, 'utf8')),
  };
  return readers[getFileExt(path)](path);
};

const walker = (before, after, func) => {
  const unionKeys = unique([...Object.keys(before), ...Object.keys(after)]);
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
      const result = gendiff(firstConfig, secondConfig, options.format);
      console.log(result);
    });

  program.parse(process.argv);
};

export { gendiffCommander };
export default gendiff;
