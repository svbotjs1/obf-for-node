import { walk } from 'estree-walker';
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
}