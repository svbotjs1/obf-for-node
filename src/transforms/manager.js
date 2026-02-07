import { StringTransformer } from './impl/strings.js';
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
}