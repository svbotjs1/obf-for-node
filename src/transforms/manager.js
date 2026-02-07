import { StringTransformer } from './impl/strings.js';
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
}