import { High } from '../presets/High.js';
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
}