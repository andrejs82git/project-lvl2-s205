import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import ini from 'ini';

const JSON_LEAD_SPACES = 2;

export const getFileExt = fpath => path.extname(fpath).replace('.', '');

export const unique = array =>
  array.filter((item, pos, arr) => arr.indexOf(item) === pos);

const read = (fpath) => {
  const readers = {
    json: p => JSON.parse(fs.readFileSync(p, 'utf8')),
    yml: p => yaml.safeLoad(fs.readFileSync(p, 'utf8')),
    ini: p => ini.parse(fs.readFileSync(p, 'utf8')),
  };
  return readers[getFileExt(fpath)](fpath);
};

const walker = (before, after, func) => {
  const unionKeys = _.uniq([..._.keys(before), ..._.keys(after)]);
  unionKeys.forEach((key) => {
    func(key, before[key], after[key]);
  });
};

const toView = view =>
  JSON.stringify(view, null, JSON_LEAD_SPACES).replace(/[",]/g, '');

const parse = (before, after) => {
  const result = {};
  walker(before, after, (key, bvalue, avalue) => {
    if (bvalue === avalue) {
      result[`  ${key}`] = `${bvalue}`;
    } else if (typeof bvalue === 'undefined') {
      result[`+ ${key}`] = `${avalue}`;
    } else if (typeof avalue === 'undefined') {
      result[`- ${key}`] = `${bvalue}`;
    } else {
      result[`+ ${key}`] = `${avalue}`;
      result[`- ${key}`] = `${bvalue}`;
    }
  });

  return toView(result);
};

const gendiff = (firstConfig, secondConfig) => {
  const before = read(firstConfig);
  const after = read(secondConfig);
  return parse(before, after);
};

export default gendiff;
