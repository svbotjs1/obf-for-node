import { walk } from 'estree-walker';
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
}