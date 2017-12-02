import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import ini from 'ini';

const LEAD_SPACE = '  ';

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

const modelToJson = (model) => {
  const objToJson = (val, depth) => JSON.stringify(val, null, LEAD_SPACE.length)
    .replace(/^/gm, `${LEAD_SPACE.repeat(depth + 1)}`)
    .replace(/([^\s]+:)/g, '  $1')
    .replace(/[",]/g, '')
    .trim();

  const iter = (node, depth = 0) => {
    if (_.isArray(node)) {
      const result = node.reduce((acc, childNode) => `${acc}${iter(childNode, depth + 1)}`, '');
      return `{${result}\n${LEAD_SPACE.repeat(depth)}}`;
    }

    const { type, key } = node;
    switch (type) {
      case 'eqo': return `\n${LEAD_SPACE.repeat(depth)}  ${key}: ${iter(node.val, depth + 1)}`;
      case 'eq': return `\n${LEAD_SPACE.repeat(depth)}  ${key}: ${node.val}`;
      case 'add': return `\n${LEAD_SPACE.repeat(depth)}+ ${key}: ${objToJson(node.val, depth)}`;
      case 'remove': return `\n${LEAD_SPACE.repeat(depth)}- ${key}: ${objToJson(node.val, depth)}`;
      case 'mutation': return `\n${LEAD_SPACE.repeat(depth)}+ ${key}: ${objToJson(node.vala, depth)}\n${LEAD_SPACE.repeat(depth)}- ${key}: ${objToJson(node.valb, depth)}`;
      default: throw Error('Tree not valid!');
    }
  };
  return iter(model);
};

const parse = (before, after) => {
  const iter = (bvalue, avalue, key) => {
    if (_.isObject(bvalue) && _.isObject(avalue)) {
      const unionKeys = _.uniq([..._.keys(bvalue), ..._.keys(avalue)]);
      const result = unionKeys.reduce((acc, k) =>
        [...acc, iter(bvalue[k], avalue[k], k)], []);
      return { type: 'eqo', key, val: result };
    }

    if (bvalue === avalue) {
      return { key, type: 'eq', val: bvalue };
    } else if (typeof bvalue === 'undefined') {
      return { key, type: 'add', val: avalue };
    } else if (typeof avalue === 'undefined') {
      return { key, type: 'remove', val: bvalue };
    }

    return {
      key,
      type: 'mutation',
      valb: bvalue,
      vala: avalue,
    };
  };

  return iter(before, after).val;
};

const gendiff = (firstConfig, secondConfig) => {
  const before = read(firstConfig);
  const after = read(secondConfig);
  return modelToJson(parse(before, after));
};

export default gendiff;
