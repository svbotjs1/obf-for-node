import fs from 'node:fs/promises';
import { Engine } from './engine.js';
export async function obfuscateFile(input, output) {
  const code = await fs.readFile(input, 'utf-8');
  const res = new Engine().run(code);
  if (output) await fs.writeFile(output, res);
  return res;
}