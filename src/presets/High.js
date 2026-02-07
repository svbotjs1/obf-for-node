import { Base } from './Base.js';
export const High = {
  ...Base, compact: true, controlFlowFlattening: true, controlFlowFlatteningThreshold: 1,
  deadCodeInjection: true, deadCodeInjectionThreshold: 1, stringArray: true,
  stringArrayEncoding: ['rc4'], stringArrayThreshold: 1, rotateStringArray: true,
  shuffleStringArray: true, splitStrings: true, splitStringsChunkLength: 3,
  identifierNamesGenerator: 'hexadecimal', renameGlobals: true, transformObjectKeys: true,
  unicodeEscapeSequence: false, selfDefending: true, disableConsoleOutput: true
};