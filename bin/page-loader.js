import { program } from 'commander';
import pageLoader from '../src/pageLoader.js';

program.name('page-loader').description('CLI webpage loader').version('1.0.0');

program
  .argument('<url>', 'path to load page')
  .option('-o, --output <dir>', `Output directory (default: ${process.cwd()})`)
  .action(async (url, options) => {
    console.log('Loading website...\n');
    await pageLoader(url, options.output);
  });

program.parse();
