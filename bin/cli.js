#!/usr/bin/env node
import { program } from 'commander';
import { obfuscateFile } from '../src/core/io.js';

program
  .argument('<input>')
  .option('-o, --output <path>')
  .action(async (inp, opts) => {
    try {
      const start = Date.now();
      await obfuscateFile(inp, opts.output);
      console.log(`Build: ${Date.now() - start}ms`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  });
program.parse();