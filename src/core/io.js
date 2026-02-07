import fs from 'node:fs/promises';
import { Engine } from './engine.js';

export async function processFile(input, output, opts) {
  const code = await fs.readFile(input, 'utf-8');
  const result = new Engine(opts).run(code);
  await fs.writeFile(output, result);
}