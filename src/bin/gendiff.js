#!/usr/bin/env node

import program from 'commander';
import gendiff from '..';

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

