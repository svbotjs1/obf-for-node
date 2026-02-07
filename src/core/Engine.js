import JavaScriptObfuscator from 'javascript-obfuscator';
import { AES } from './AES.js';

export class Engine {
  constructor(c) { this.c = c; }
  async run(code, key) {
    let t = code;
    if (key) t = AES.encrypt(code, key);
    const o = JavaScriptObfuscator.obfuscate(t, this.c);
    return o.getObfuscatedCode();
  }
}