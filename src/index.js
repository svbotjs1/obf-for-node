import { Engine } from './core/engine.js';
export function obfuscate(code, opts) { return new Engine(opts).run(code); }