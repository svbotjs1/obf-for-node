import fs from 'node:fs/promises';
export class IO {
  static async read(p) { return fs.readFile(p, 'utf-8'); }
  static async write(p, d) { return fs.writeFile(p, d, 'utf-8'); }
}