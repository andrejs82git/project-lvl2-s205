import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import ini from 'ini';

const LEAD_SPACE = '  ';

export const getFileExt = fpath => path.extname(fpath).replace('.', '');

const parseConfig = (configText, configType) => {
  const parsers = {
    json: p => JSON.parse(p),
    yml: p => yaml.safeLoad(p),
    ini: p => ini.parse(p),
  };
  return parsers[configType](configText);
};

const astToText = (model) => {
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
      case 'complex': return `\n${LEAD_SPACE.repeat(depth)}  ${key}: ${iter(node.body, depth + 1)}`;
      case 'equal': return `\n${LEAD_SPACE.repeat(depth)}  ${key}: ${node.val}`;
      case 'add': return `\n${LEAD_SPACE.repeat(depth)}+ ${key}: ${objToJson(node.val, depth)}`;
      case 'remove': return `\n${LEAD_SPACE.repeat(depth)}- ${key}: ${objToJson(node.val, depth)}`;
      case 'change': return `\n${LEAD_SPACE.repeat(depth)}+ ${key}: ${objToJson(node.vala, depth)}\n${LEAD_SPACE.repeat(depth)}- ${key}: ${objToJson(node.valb, depth)}`;
      default: throw Error('Tree not valid!');
    }
  };
  return iter(model);
};

const createDiffAst = (beforeObject, afterObject) => {
  const iter = (beforeProperty, afterProperty, key) => {
    if (_.isObject(beforeProperty) && _.isObject(afterProperty)) {
      return { key, type: 'complex', body: createDiffAst(beforeProperty, afterProperty) };
    } else if (beforeProperty === afterProperty) {
      return { key, type: 'equal', val: beforeProperty };
    } else if (typeof beforeProperty === 'undefined') {
      return { key, type: 'add', val: afterProperty };
    } else if (typeof afterProperty === 'undefined') {
      return { key, type: 'remove', val: beforeProperty };
    }

    return {
      key,
      type: 'change',
      valb: beforeProperty,
      vala: afterProperty,
    };
  };

  const unionKeys = _.union(_.keys(beforeObject), _.keys(afterObject));
  return unionKeys.reduce((acc, key) =>
    [...acc, iter(beforeObject[key], afterObject[key], key)], []);
};

const gendiff = (firstConfigFilePath, secondConfigFilePath) => {
  const firstConfig = parseConfig(fs.readFileSync(firstConfigFilePath, 'utf8'), getFileExt(firstConfigFilePath));
  const secondConfig = parseConfig(fs.readFileSync(secondConfigFilePath, 'utf8'), getFileExt(secondConfigFilePath));
  return astToText(createDiffAst(firstConfig, secondConfig));
};

export default gendiff;
