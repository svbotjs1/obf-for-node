import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CWD = process.cwd();

const files = {
  'package.json': JSON.stringify({
    "name": "@vxk/obf-node",
    "version": "1.0.0",
    "type": "module",
    "bin": { "vxk-obf": "bin/cli.js" },
    "exports": "./src/index.js",
    "engines": { "node": ">=18" },
    "publishConfig": { "access": "public" },
    "dependencies": {
      "chalk": "^5.3.0",
      "commander": "^11.1.0",
      "javascript-obfuscator": "^4.1.0"
    }
  }, null, 2),

  '.github/workflows/publish.yml': `name: Publish
on: workflow_dispatch
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}`,

  'README.md': `# @vxk/obf-node\n\n## Encrypt\n\`vxk-obf -f app.js -k my-secret-key\`\n\n## Run\n\`VXK_KEY=my-secret-key node app.obf.js\``,

  'bin/cli.js': `#!/usr/bin/env node
import { CLI } from '../src/cli/Interface.js';
new CLI().run();`,

  'src/index.js': `export { Engine } from './core/Engine.js';`,

  'src/cli/Interface.js': `import { program } from 'commander';
import { ConfigManager } from '../config/ConfigManager.js';
import { IO } from '../utils/IO.js';
import { Engine } from '../core/Engine.js';
import { Logger } from '../utils/Logger.js';

export class CLI {
  constructor() {
    program
      .requiredOption('-f, --file <path>', 'Input')
      .option('-o, --output <path>', 'Output')
      .option('-k, --key <string>', 'AES Key')
      .option('-p, --preset <name>', 'high, medium, low', 'high')
      .option('--compact', 'Compact', true)
      .option('--dead-code', 'Dead code')
      .option('--control-flow', 'Control flow')
      .option('--split-strings', 'Split strings')
      .option('--string-array', 'String array')
      .option('--self-defending', 'Self defending')
      .option('--debug-protection', 'Debug protection')
      .option('--disable-console', 'Disable console');
  }
  async run() {
    program.parse();
    const opts = program.opts();
    try {
      const config = new ConfigManager(opts).build();
      const code = await IO.read(opts.file);
      Logger.log('Encrypting...');
      const result = await new Engine(config).run(code, opts.key);
      const out = opts.output || opts.file.replace('.js', '.obf.js');
      await IO.write(out, result);
      Logger.success(out);
    } catch (e) {
      Logger.error(e.message);
      process.exit(1);
    }
  }
}`,

  'src/config/ConfigManager.js': `import { High } from '../presets/High.js';
import { Medium } from '../presets/Medium.js';
import { Low } from '../presets/Low.js';

export class ConfigManager {
  constructor(opts) { this.opts = opts; }
  build() {
    let base = this.getPreset(this.opts.preset);
    const f = this.opts;
    if (f.compact === false) base.compact = false;
    if (f.deadCode) { base.deadCodeInjection = true; base.deadCodeInjectionThreshold = 0.2; }
    if (f.controlFlow) { base.controlFlowFlattening = true; base.controlFlowFlatteningThreshold = 0.8; }
    if (f.splitStrings) { base.splitStrings = true; base.splitStringsChunkLength = 5; }
    if (f.stringArray) base.stringArray = true;
    if (f.selfDefending) base.selfDefending = true;
    if (f.debugProtection) { base.debugProtection = true; base.debugProtectionInterval = 2000; }
    if (f.disableConsole) base.disableConsoleOutput = true;
    return base;
  }
  getPreset(n) {
    if (n === 'low') return Low;
    if (n === 'medium') return Medium;
    return High;
  }
}`,

  'src/core/Engine.js': `import JavaScriptObfuscator from 'javascript-obfuscator';
import { AES } from './AES.js';

export class Engine {
  constructor(c) { this.c = c; }
  async run(code, key) {
    let t = code;
    if (key) t = AES.encrypt(code, key);
    const o = JavaScriptObfuscator.obfuscate(t, this.c);
    return o.getObfuscatedCode();
  }
}`,

  'src/core/AES.js': `import crypto from 'node:crypto';
export class AES {
  static encrypt(code, kRaw) {
    const k = crypto.createHash('sha256').update(kRaw).digest();
    const iv = crypto.randomBytes(16);
    const c = crypto.createCipheriv('aes-256-cbc', k, iv);
    let e = c.update(code, 'utf8', 'hex');
    e += c.final('hex');
    return \`import c from 'node:crypto';
const k = process.env.VXK_KEY;
if(!k)process.exit(1);
const h = c.createHash('sha256').update(k).digest();
const i = Buffer.from('\${iv.toString('hex')}', 'hex');
const d = c.createDecipheriv('aes-256-cbc', h, i);
let s = d.update('\${e}', 'hex', 'utf8');
s += d.final('utf8');
const m = new module.constructor();
m.paths = module.paths;
m._compile(s, 'vxk');\`;
  }
}`,

  'src/presets/Base.js': `export const Base = { target: 'node', seed: 0, sourceMap: false, renameGlobals: false };`,
  'src/presets/Low.js': `import { Base } from './Base.js'; export const Low = { ...Base, compact: true, identifierNamesGenerator: 'mangled' };`,
  'src/presets/Medium.js': `import { Base } from './Base.js'; export const Medium = { ...Base, compact: true, controlFlowFlattening: true, controlFlowFlatteningThreshold: 0.5, stringArray: true, identifierNamesGenerator: 'hexadecimal' };`,
  'src/presets/High.js': `import { Base } from './Base.js';
export const High = {
  ...Base, compact: true, controlFlowFlattening: true, controlFlowFlatteningThreshold: 1,
  deadCodeInjection: true, deadCodeInjectionThreshold: 1, stringArray: true,
  stringArrayEncoding: ['rc4'], stringArrayThreshold: 1, rotateStringArray: true,
  shuffleStringArray: true, splitStrings: true, splitStringsChunkLength: 3,
  identifierNamesGenerator: 'hexadecimal', renameGlobals: true, transformObjectKeys: true,
  unicodeEscapeSequence: false, selfDefending: true, disableConsoleOutput: true
};`,

  'src/utils/IO.js': `import fs from 'node:fs/promises';
export class IO {
  static async read(p) { return fs.readFile(p, 'utf-8'); }
  static async write(p, d) { return fs.writeFile(p, d, 'utf-8'); }
}`,

  'src/utils/Logger.js': `import chalk from 'chalk';
export class Logger {
  static log(m) { console.log(chalk.blue(m)); }
  static success(m) { console.log(chalk.green(m)); }
  static error(m) { console.log(chalk.red(m)); }
}`
};

if (fs.existsSync(path.join(CWD, 'src'))) fs.rmSync(path.join(CWD, 'src'), { recursive: true, force: true });
Object.entries(files).forEach(([f, c]) => {
  const p = path.join(CWD, f);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, c);
  console.log(f);
});
console.log('Run: npm install');
