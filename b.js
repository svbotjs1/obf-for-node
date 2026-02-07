import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CWD = process.cwd();

const files = {
  // 1. CONFIGURATION
  'package.json': JSON.stringify({
    "name": "obf-for-node",
    "version": "1.0.0",
    "type": "module",
    "bin": { "obf": "bin/cli.js" },
    "exports": "./src/index.js",
    "engines": { "node": ">=20" },
    "dependencies": {
      "acorn": "^8.11.0",
      "astring": "^1.8.6",
      "commander": "^11.1.0",
      "estree-walker": "^3.0.3"
    }
  }, null, 2),

  'README.md': `# Obfuscator\nUsage: \`node bin/cli.js input.js -o out.js\``,
  
  'src/config.js': `export const CONFIG = {
  compact: true,
  controlFlow: true,
  deadCode: 0.2,
  stringArray: true,
  stringArrayThreshold: 0.8,
  rotateStringArray: true,
  antiDebug: true,
  antiTamper: true,
  mangle: true,
  splitStrings: true
};`,

  // 2. BINARY
  'bin/cli.js': `#!/usr/bin/env node
import { program } from 'commander';
import { obfuscateFile } from '../src/core/io.js';

program
  .argument('<input>')
  .option('-o, --output <path>')
  .action(async (inp, opts) => {
    try {
      const start = Date.now();
      await obfuscateFile(inp, opts.output);
      console.log(\`Build: \${Date.now() - start}ms\`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  });
program.parse();`,

  // 3. MAIN ENTRY
  'src/index.js': `import { Engine } from './core/engine.js';
export function obfuscate(code, opts) { return new Engine(opts).run(code); }`,

  // 4. CORE ENGINE
  'src/core/engine.js': `import * as acorn from 'acorn';
import { generate } from 'astring';
import { CONFIG } from '../config.js';
import { TransformManager } from '../transforms/manager.js';

export class Engine {
  constructor(opts = {}) {
    this.opts = { ...CONFIG, ...opts };
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
export async function obfuscateFile(input, output) {
  const code = await fs.readFile(input, 'utf-8');
  const res = new Engine().run(code);
  if (output) await fs.writeFile(output, res);
  return res;
}`,

  // 5. UTILITIES
  'src/utils/random.js': `export const hex = (str) => str.split('').map(c => '\\\\x' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
export const randName = (len=6) => {
  const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
  return '_' + Array.from({length: len}, () => c[Math.floor(Math.random() * c.length)]).join('');
};
export const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;`,

  'src/utils/ast.js': `export const isStr = (n) => n.type === 'Literal' && typeof n.value === 'string';
export const createCall = (name, args) => ({
  type: 'CallExpression',
  callee: { type: 'Identifier', name },
  arguments: args
});`,

  // 6. TRANSFORM MANAGER
  'src/transforms/manager.js': `import { StringTransformer } from './impl/strings.js';
import { ControlFlowTransformer } from './impl/controlFlow.js';
import { DeadCodeTransformer } from './impl/deadCode.js';
import { AntiDebugTransformer } from './impl/antiDebug.js';
import { AntiTamperTransformer } from './impl/antiTamper.js';
import { MangleTransformer } from './impl/mangle.js';
import { NumberTransformer } from './impl/numbers.js';

export class TransformManager {
  constructor(opts) { this.opts = opts; }
  apply(ast) {
    if(this.opts.antiTamper) new AntiTamperTransformer().transform(ast);
    if(this.opts.controlFlow) new ControlFlowTransformer().transform(ast);
    if(this.opts.deadCode) new DeadCodeTransformer().transform(ast);
    if(this.opts.stringArray) new StringTransformer(this.opts).transform(ast);
    new NumberTransformer().transform(ast);
    if(this.opts.antiDebug) new AntiDebugTransformer().transform(ast);
    if(this.opts.mangle) new MangleTransformer().transform(ast);
  }
}`,

  // 7. TRANSFORM IMPLEMENTATIONS (The Heavy Lifters)
  'src/transforms/impl/strings.js': `import { walk } from 'estree-walker';
import { hex, randName, randInt } from '../../utils/random.js';
import { isStr } from '../../utils/ast.js';

export class StringTransformer {
  constructor(opts) { this.opts = opts; }
  transform(ast) {
    const strings = [];
    const map = new Map();
    walk(ast, {
      enter: (node) => {
        if (isStr(node) && node.value.length > 2) {
          if (!map.has(node.value)) {
            map.set(node.value, strings.length);
            strings.push(node.value);
          }
          node._idx = map.get(node.value);
          node._skip = true;
        }
      }
    });
    if (!strings.length) return;
    
    const arrName = randName(5);
    const offset = randInt(10, 100);
    
    // String Rotation Logic
    const rotated = [...strings];
    for(let i=0; i<offset; i++) rotated.push(rotated.shift());

    ast.body.unshift({
      type: 'VariableDeclaration', kind: 'const',
      declarations: [{
        type: 'VariableDeclarator', id: { type: 'Identifier', name: arrName },
        init: { type: 'ArrayExpression', elements: rotated.map(s => ({ type: 'Literal', value: s, raw: \`'\${hex(s)}'\` })) }
      }]
    });

    const getter = randName(4);
    ast.body.splice(1, 0, {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: getter },
      params: [{ type: 'Identifier', name: 'i' }],
      body: {
        type: 'BlockStatement',
        body: [{
          type: 'ReturnStatement',
          argument: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: arrName },
            property: { 
              type: 'BinaryExpression', operator: '-', 
              left: { type: 'Identifier', name: 'i' }, 
              right: { type: 'Literal', value: offset } 
            },
            computed: true
          }
        }]
      }
    });

    walk(ast, {
      enter: (node) => {
        if (node._skip) {
          node.type = 'CallExpression';
          node.callee = { type: 'Identifier', name: getter };
          node.arguments = [{ type: 'Literal', value: node._idx + offset }];
          delete node.value; delete node.raw;
        }
      }
    });
  }
}`,

  'src/transforms/impl/controlFlow.js': `import { shuffle, randName } from '../../utils/random.js';
export class ControlFlowTransformer {
  transform(ast) {
    const visit = (node) => {
      if ((node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') && node.body.body.length > 3) {
        const body = node.body.body;
        const keys = shuffle(body.map((_, i) => i));
        const sVar = randName(3);
        const cases = keys.map(k => ({
          type: 'SwitchCase', test: { type: 'Literal', value: k },
          consequent: [body[k], { type: 'BreakStatement' }]
        }));
        
        node.body.body = [{
          type: 'VariableDeclaration', kind: 'var',
          declarations: [{
            type: 'VariableDeclarator', id: { type: 'Identifier', name: '_seq' },
            init: { type: 'CallExpression', callee: { property: { name: 'split' }, object: { value: keys.join('|'), type: 'Literal' } }, arguments: [{ value: '|', type: 'Literal' }] }
          }]
        }, {
          type: 'VariableDeclaration', kind: 'var',
          declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: sVar }, init: { value: 0, type: 'Literal' } }]
        }, {
          type: 'WhileStatement', test: { value: true, type: 'Literal' },
          body: {
            type: 'BlockStatement',
            body: [{
              type: 'SwitchStatement',
              discriminant: { type: 'UnaryExpression', operator: '+', argument: { type: 'MemberExpression', object: { name: '_seq', type: 'Identifier' }, property: { type: 'UpdateExpression', operator: '++', argument: { name: sVar, type: 'Identifier' } }, computed: true } },
              cases: cases
            }, {
              type: 'IfStatement', test: { type: 'BinaryExpression', operator: '==', left: { name: sVar, type: 'Identifier' }, right: { value: keys.length, type: 'Literal' } },
              consequent: { type: 'BreakStatement' }
            }]
          }
        }];
      }
      for(const k in node) if(typeof node[k]==='object'&&node[k]) { if(Array.isArray(node[k])) node[k].forEach(visit); else visit(node[k]); }
    };
    visit(ast);
  }
}`,

  'src/transforms/impl/deadCode.js': `import { randName, randInt } from '../../utils/random.js';
export class DeadCodeTransformer {
  transform(ast) {
    const junk = {
      type: 'IfStatement',
      test: { type: 'BinaryExpression', operator: '===', left: { type: 'Literal', value: randInt(0,100) }, right: { type: 'Literal', value: randInt(101,200) } },
      consequent: {
        type: 'BlockStatement',
        body: [{
          type: 'ExpressionStatement',
          expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'console.log' }, arguments: [{ type: 'Literal', value: randName(50) }] }
        }]
      },
      alternate: null
    };
    if (ast.body) ast.body.splice(Math.floor(Math.random() * ast.body.length), 0, junk);
  }
}`,

  'src/transforms/impl/antiDebug.js': `export class AntiDebugTransformer {
  transform(ast) {
    const d = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'FunctionExpression', params: [],
          body: {
            type: 'BlockStatement',
            body: [{
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'setInterval' },
              arguments: [{
                type: 'ArrowFunctionExpression', params: [],
                body: { type: 'BlockStatement', body: [{ type: 'DebuggerStatement' }] }
              }, { type: 'Literal', value: 4000 }]
            }]
          }
        }, arguments: []
      }
    };
    ast.body.unshift(d);
  }
}`,

  'src/transforms/impl/antiTamper.js': `import { randName } from '../../utils/random.js';
export class AntiTamperTransformer {
  transform(ast) {
    const check = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { type: 'FunctionExpression', params: [], body: {
          type: 'BlockStatement',
          body: [{
            type: 'TryStatement',
            block: {
              type: 'BlockStatement',
              body: [{
                type: 'IfStatement',
                test: {
                  type: 'BinaryExpression', operator: '===',
                  left: { type: 'CallExpression', callee: { type: 'MemberExpression', object: { type: 'MemberExpression', object: { type: 'Identifier', name: 'Function' }, property: { type: 'Identifier', name: 'prototype' } }, property: { type: 'Identifier', name: 'toString' } }, property: { type: 'Identifier', name: 'call' } }, arguments: [{ type: 'Identifier', name: 'console.log' }] },
                  right: { type: 'CallExpression', callee: { type: 'MemberExpression', object: { type: 'MemberExpression', object: { type: 'Identifier', name: 'Function' }, property: { type: 'Identifier', name: 'prototype' } }, property: { type: 'Identifier', name: 'toString' } }, property: { type: 'Identifier', name: 'call' } }, arguments: [{ type: 'Identifier', name: 'console.log' }] }
                },
                consequent: { type: 'BlockStatement', body: [] },
                alternate: { type: 'BlockStatement', body: [{ type: 'WhileStatement', test: { type: 'Literal', value: true }, body: { type: 'BlockStatement', body: [] } }] }
              }]
            },
            handler: null, finalizer: null
          }]
        } },
        arguments: []
      }
    };
    ast.body.unshift(check);
  }
}`,

  'src/transforms/impl/mangle.js': `import { walk } from 'estree-walker';
import { randName } from '../../utils/random.js';
export class MangleTransformer {
  transform(ast) {
    const map = new Map();
    const reserved = ['require', 'exports', 'module', 'console', 'window', 'global', 'process', 'Buffer'];
    
    walk(ast, {
      enter(node) {
        if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
          if (!reserved.includes(node.id.name) && !map.has(node.id.name)) map.set(node.id.name, randName(4));
        }
        if (node.type === 'FunctionDeclaration' && node.id) {
          if (!reserved.includes(node.id.name) && !map.has(node.id.name)) map.set(node.id.name, randName(4));
        }
      }
    });
    walk(ast, {
      enter(node) {
        if (node.type === 'Identifier' && map.has(node.name)) node.name = map.get(node.name);
      }
    });
  }
}`,

  'src/transforms/impl/numbers.js': `import { walk } from 'estree-walker';
import { randInt } from '../../utils/random.js';
export class NumberTransformer {
  transform(ast) {
    walk(ast, {
      enter(node) {
        if (node.type === 'Literal' && typeof node.value === 'number' && Number.isInteger(node.value) && node.value > 10) {
          const key = randInt(1, 100);
          node.type = 'BinaryExpression';
          node.operator = '^';
          node.left = { type: 'Literal', value: node.value ^ key };
          node.right = { type: 'Literal', value: key };
        }
      }
    });
  }
}`
};

console.log('Generating obf-for-node...');
Object.entries(files).forEach(([f, c]) => {
  const p = path.join(CWD, f);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, c);
  console.log(`+ ${f}`);
});
console.log('Done. Run: npm install');
