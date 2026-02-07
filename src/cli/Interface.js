import { program } from 'commander';
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
}