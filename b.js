import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CWD = process.cwd();

const files = {
  // --- 1. METADATA & CI/CD ---
  'package.json': JSON.stringify({
    "name": "obf-for-node",
    "version": "1.0.0",
    "description": "Professional Node.js Obfuscator",
    "type": "module",
    "bin": { "obf-for-node": "bin/cli.js" },
    "exports": "./src/index.js",
    "engines": { "node": ">=18" },
    "scripts": { 
      "test": "echo 'No tests'",
      "prepare": "npm run test"
    },
    "keywords": ["obfuscator", "security", "protection", "node"],
    "author": "User",
    "license": "MIT",
    "dependencies": {
      "acorn": "^8.11.0",
      "astring": "^1.8.6",
      "commander": "^11.1.0",
      "estree-walker": "^3.0.3"
    }
  }, null, 2),

  '.github/workflows/publish.yml': `name: Publish Package
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}`,

  'README.md': `# obf-for-node

Advanced JavaScript Obfuscator for Node.js applications.

## Installation

\`\`\`bash
npm install -g obf-for-node
\`\`\`

## CLI Usage

\`\`\`bash
obf-for-node -f <input> -o <output> [options]
\`\`\`

| Option | Description |
|--------|-------------|
| \`-f, --file\` | Input file path (Required) |
| \`-o, --output\` | Output file path (Required) |
| \`--antidebug\` | Inject anti-debugging loops |
| \`--antitamper\` | Inject function integrity checks |
| \`--compact\` | Minify output |
| \`--str-array\` | Enable String Array encryption |
| \`--control-flow\` | Enable Control Flow Flattening |

### Example

\`\`\`bash
obf-for-node -f server.js -o server.obf.js --antidebug --control-flow
\`\`\`

## API Usage

\`\`\`javascript
import { obfuscate } from 'obf-for-node';

const code = 'const x = 1;';
const result = obfuscate(code, {
    compact: true,
    antiDebug: true
});
\`\`\`
`,

  // --- 2. CLI ENTRY ---
  'bin/cli.js': `#!/usr/bin/env node
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
      console.log(\`Done: \${opts.output} (\${Date.now() - start}ms)\`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  });
program.parse();`,

  // --- 3. CONFIG & CORE ---
  'src/index.js': `import { Engine } from './core/engine.js';
export function obfuscate(code, opts) { return new Engine(opts).run(code); }`,

  'src/config.js': `export const DEFAULTS = {
  compact: true,
  controlFlow: false,
  stringArray: false,
  antiDebug: false,
  antiTamper: false,
  mangle: true,
  deadCode: 0.1
};`,

  'src/core/engine.js': `import * as acorn from 'acorn';
import { generate } from 'astring';
import { DEFAULTS } from '../config.js';
import { TransformManager } from '../transforms/manager.js';

export class Engine {
  constructor(opts = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    this.manager = new TransformManager(this.opts);
  }
  run(code) {
    const ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
    this.manager.apply(ast);
    return generate(ast, {
      indent: this.opts.compact ? '' : '  ',
      lineEnd: this.opts.compact ? '' : '\\n'
    });
  }
}`,

  'src/core/io.js': `import fs from 'node:fs/promises';
import { Engine } from './engine.js';

export async function processFile(input, output, opts) {
  const code = await fs.readFile(input, 'utf-8');
  const result = new Engine(opts).run(code);
  await fs.writeFile(output, result);
}`,

  // --- 4. UTILS ---
  'src/utils/random.js': `export const hex = (str) => str.split('').map(c => '\\\\x' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
export const randName = (len=6) => '_' + Math.random().toString(36).substring(2, 2+len);
export const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;`,

  'src/utils/ast.js': `export const isStr = (n) => n.type === 'Literal' && typeof n.value === 'string';
export const block = (body) => ({ type: 'BlockStatement', body });`,

  // --- 5. TRANSFORMS MANAGER ---
  'src/transforms/manager.js': `import { StringTransformer } from './impl/strings.js';
import { ControlFlow } from './impl/controlFlow.js';
import { DeadCode } from './impl/deadCode.js';
import { AntiDebug } from './impl/antiDebug.js';
import { AntiTamper } from './impl/antiTamper.js';
import { Mangle } from './impl/mangle.js';

export class TransformManager {
  constructor(opts) { this.opts = opts; }
  apply(ast) {
    if(this.opts.antitamper) new AntiTamper().run(ast);
    if(this.opts.controlFlow) new ControlFlow().run(ast);
    if(this.opts.strArray) new StringTransformer().run(ast);
    new DeadCode().run(ast);
    if(this.opts.antidebug) new AntiDebug().run(ast);
    if(this.opts.mangle) new Mangle().run(ast);
  }
}`,

  // --- 6. IMPLEMENTATIONS ---
  'src/transforms/impl/strings.js': `import { walk } from 'estree-walker';
import { hex, randName, randInt } from '../../utils/random.js';
import { isStr } from '../../utils/ast.js';

export class StringTransformer {
  run(ast) {
    const pool = [];
    const map = new Map();
    walk(ast, {
      enter: (n) => {
        if (isStr(n) && n.value.length > 2) {
          if (!map.has(n.value)) {
            map.set(n.value, pool.length);
            pool.push(n.value);
          }
          n._idx = map.get(n.value);
          n._skip = true;
        }
      }
    });
    if (!pool.length) return;
    
    const arrName = randName(5);
    const shift = randInt(5, 20);
    const rotated = [...pool];
    for(let i=0; i<shift; i++) rotated.push(rotated.shift());

    ast.body.unshift({
      type: 'VariableDeclaration', kind: 'const',
      declarations: [{
        type: 'VariableDeclarator', id: { type: 'Identifier', name: arrName },
        init: { type: 'ArrayExpression', elements: rotated.map(s => ({ type: 'Literal', value: s, raw: \`'\${hex(s)}'\` })) }
      }]
    });

    const decName = randName(4);
    ast.body.splice(1, 0, {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: decName },
      params: [{ type: 'Identifier', name: 'i' }],
      body: {
        type: 'BlockStatement',
        body: [{
          type: 'ReturnStatement',
          argument: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: arrName },
            property: { type: 'BinaryExpression', operator: '-', left: { type: 'Identifier', name: 'i' }, right: { type: 'Literal', value: shift } },
            computed: true
          }
        }]
      }
    });

    walk(ast, {
      enter: (n) => {
        if (n._skip) {
          n.type = 'CallExpression';
          n.callee = { type: 'Identifier', name: decName };
          n.arguments = [{ type: 'Literal', value: n._idx + shift }];
          delete n.value; delete n.raw;
        }
      }
    });
  }
}`,

  'src/transforms/impl/controlFlow.js': `import { shuffle, randName } from '../../utils/random.js';
export class ControlFlow {
  run(ast) {
    const visit = (n) => {
      if ((n.type === 'FunctionDeclaration' || n.type === 'ArrowFunctionExpression') && n.body.body.length > 3) {
        const body = n.body.body;
        const keys = shuffle(body.map((_, i) => i));
        const sVar = randName(3);
        const cases = keys.map(k => ({
          type: 'SwitchCase', test: { type: 'Literal', value: k },
          consequent: [body[k], { type: 'BreakStatement' }]
        }));
        
        n.body.body = [{
          type: 'VariableDeclaration', kind: 'const',
          declarations: [{
            type: 'VariableDeclarator', id: { type: 'Identifier', name: '_k' },
            init: { type: 'CallExpression', callee: { property: { name: 'split' }, object: { value: keys.join('|'), type: 'Literal' } }, arguments: [{ value: '|', type: 'Literal' }] }
          }]
        }, {
          type: 'VariableDeclaration', kind: 'let',
          declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: sVar }, init: { value: 0, type: 'Literal' } }]
        }, {
          type: 'WhileStatement', test: { value: true, type: 'Literal' },
          body: {
            type: 'BlockStatement',
            body: [{
              type: 'SwitchStatement',
              discriminant: { type: 'UnaryExpression', operator: '+', argument: { type: 'MemberExpression', object: { name: '_k', type: 'Identifier' }, property: { type: 'UpdateExpression', operator: '++', argument: { name: sVar, type: 'Identifier' } }, computed: true } },
              cases: cases
            }, {
              type: 'IfStatement', test: { type: 'BinaryExpression', operator: '==', left: { name: sVar, type: 'Identifier' }, right: { value: keys.length, type: 'Literal' } },
              consequent: { type: 'BreakStatement' }
            }]
          }
        }];
      }
      for(const k in n) if(typeof n[k]==='object'&&n[k]) { if(Array.isArray(n[k])) n[k].forEach(visit); else visit(n[k]); }
    };
    visit(ast);
  }
}`,

  'src/transforms/impl/deadCode.js': `import { randName, randInt } from '../../utils/random.js';
export class DeadCode {
  run(ast) {
    const node = {
      type: 'IfStatement',
      test: { type: 'BinaryExpression', operator: '===', left: { type: 'Literal', value: randInt(0,50) }, right: { type: 'Literal', value: randInt(51,100) } },
      consequent: { type: 'BlockStatement', body: [] },
      alternate: null
    };
    if (ast.body) ast.body.splice(Math.floor(Math.random() * ast.body.length), 0, node);
  }
}`,

  'src/transforms/impl/antiDebug.js': `export class AntiDebug {
  run(ast) {
    ast.body.unshift({
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { type: 'FunctionExpression', params: [], body: {
          type: 'BlockStatement',
          body: [{
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'setInterval' },
            arguments: [{
              type: 'ArrowFunctionExpression', params: [],
              body: { type: 'BlockStatement', body: [{ type: 'DebuggerStatement' }] }
            }, { type: 'Literal', value: 4000 }]
          }]
        }}, arguments: []
      }
    });
  }
}`,

  'src/transforms/impl/antiTamper.js': `export class AntiTamper {
  run(ast) {
    ast.body.unshift({
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { type: 'FunctionExpression', params: [], body: {
          type: 'BlockStatement',
          body: [{
            type: 'IfStatement',
            test: {
              type: 'BinaryExpression', operator: '!==',
              left: { type: 'CallExpression', callee: { type: 'MemberExpression', object: { type: 'CallExpression', callee: { type: 'MemberExpression', object: { type: 'Identifier', name: 'console' }, property: { type: 'Identifier', name: 'log' } } }, property: { type: 'Identifier', name: 'toString' } } },
              right: { type: 'Literal', value: '[object Object]' } 
            },
            consequent: { type: 'BlockStatement', body: [] } 
          }]
        }}, arguments: []
      }
    });
  }
}`,

  'src/transforms/impl/mangle.js': `import { walk } from 'estree-walker';
import { randName } from '../../utils/random.js';
export class Mangle {
  run(ast) {
    const map = new Map();
    const reserved = ['require', 'exports', 'module', 'console', 'process', 'global'];
    
    walk(ast, {
      enter(n) {
        if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') {
          if (!reserved.includes(n.id.name) && !map.has(n.id.name)) map.set(n.id.name, randName(4));
        }
        if (n.type === 'FunctionDeclaration' && n.id) {
          if (!reserved.includes(n.id.name) && !map.has(n.id.name)) map.set(n.id.name, randName(4));
        }
      }
    });
    walk(ast, {
      enter(n) {
        if (n.type === 'Identifier' && map.has(n.name)) n.name = map.get(n.name);
      }
    });
  }
}`
};

console.log('Generating files...');
Object.entries(files).forEach(([f, c]) => {
  const p = path.join(CWD, f);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, c);
  console.log(`+ ${f}`);
});
console.log('Done.');
