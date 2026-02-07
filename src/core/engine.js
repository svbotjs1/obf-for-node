import * as acorn from 'acorn';
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
      lineEnd: this.opts.compact ? '' : '\n'
    });
  }
}