#!/usr/bin/env node
import { program } from 'commander';
import pageLoader from '../src/pageLoader.js';

program.name('page-loader').description('CLI webpage loader').version('1.0.0');

program
  .argument('<url>', 'path to load page')
  .option(
    '-o, --output <dir>',
    `Output directory (default: ${process.cwd()})`,
    process.cwd()
  )
  .action(async (url, options) => {
    console.log('Loading website...');
    try {
      await pageLoader(url, options.output);
      process.exit(0);
    } catch (e) {
      console.error(e instanceof Error ? e.message : 'Unknown error occurred');
      process.exit(1);
    }
  });

program.parse();
