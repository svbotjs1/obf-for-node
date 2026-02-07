#!/usr/bin/env node
import { program } from 'commander';
import { processFile } from '../src/core/io.js';

program
  .requiredOption('-f, --file <path>')
  .requiredOption('-o, --output <path>')
  .option('--compact')
  .option('--antidebug')
  .option('--antitamper')
  .option('--str-array')
  .option('--control-flow')
  .action(async (opts) => {
    try {
      const start = Date.now();
      await processFile(opts.file, opts.output, opts);
      console.log(`Done: ${opts.output} (${Date.now() - start}ms)`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  });
program.parse();