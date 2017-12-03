import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import ini from 'ini';

export const getFileExt = fpath => path.extname(fpath).replace('.', '');

const parseConfig = (configText, configType) => {
  const parsers = {
    json: p => JSON.parse(p),
    yml: p => yaml.safeLoad(p),
    ini: p => ini.parse(p),
  };
  return parsers[configType](configText);
};

const objToJson = (object, depth) => JSON.stringify(object, null, 4)
  .replace(/^/gm, `${' '.repeat(depth * 4)}`)
  .replace(/[",]/g, '')
  .trim();

const astToTextStrategy = {
  rootDiff: (node, depth, body) => `{${body}\n}`,
  complex: (node, depth, body) => `\n${' '.repeat(depth * 4)}${node.key}: {${body}\n${' '.repeat(depth * 4)}}`,
  equal: (node, depth) => `\n${' '.repeat(depth * 4)}${node.key}: ${node.property}`,
  add: (node, depth) => `\n${' '.repeat((depth * 4) - 2)}+ ${node.key}: ${objToJson(node.property, depth)}`,
  remove: (node, depth) => `\n${' '.repeat((depth * 4) - 2)}- ${node.key}: ${objToJson(node.property, depth)}`,
  change: (node, depth) => `\n${' '.repeat((depth * 4) - 2)}+ ${node.key}: ${objToJson(node.afterProperty, depth)}\n${' '.repeat((depth * 4) - 2)}- ${node.key}: ${objToJson(node.beforeProperty, depth)}`,
};

const astToText = (model, printStrategy) => {
  const iter = (node, depth = 0) => {
    switch (node.type) {
      case 'complex':
      case 'rootDiff': {
        const body = node.body.reduce((acc, childNode) => `${acc}${iter(childNode, depth + 1)}`, '');
        return printStrategy[node.type](node, depth, body);
      }
      default: return printStrategy[node.type](node, depth);
    }
  };
  return iter(model);
};

const iterDiffAst = (beforeObject, afterObject) => {
  const iter = (beforeProperty, afterProperty, key) => {
    if (_.isObject(beforeProperty) && _.isObject(afterProperty)) {
      return { key, type: 'complex', body: iterDiffAst(beforeProperty, afterProperty) };
    } else if (beforeProperty === afterProperty) {
      return { key, type: 'equal', property: beforeProperty };
    } else if (typeof beforeProperty === 'undefined') {
      return { key, type: 'add', property: afterProperty };
    } else if (typeof afterProperty === 'undefined') {
      return { key, type: 'remove', property: beforeProperty };
    }

    return {
      key,
      type: 'change',
      beforeProperty,
      afterProperty,
    };
  };

  const unionKeys = _.union(_.keys(beforeObject), _.keys(afterObject));
  return unionKeys.reduce((acc, key) =>
    [...acc, iter(beforeObject[key], afterObject[key], key)], []);
};

const createDiffAst = (beforeObject, afterObject) =>
  ({ type: 'rootDiff', body: iterDiffAst(beforeObject, afterObject) });

const gendiff = (firstConfigFilePath, secondConfigFilePath) => {
  const firstConfig = parseConfig(fs.readFileSync(firstConfigFilePath, 'utf8'), getFileExt(firstConfigFilePath));
  const secondConfig = parseConfig(fs.readFileSync(secondConfigFilePath, 'utf8'), getFileExt(secondConfigFilePath));
  return astToText(createDiffAst(firstConfig, secondConfig), astToTextStrategy);
};

export default gendiff;
