import { walk } from 'estree-walker';
import { randInt } from '../../utils/random.js';
export class NumberTransformer {
  transform(ast) {
    walk(ast, {
      enter(node) {
        if (node.type === 'Literal' && typeof node.value === 'number' && Number.isInteger(node.value) && node.value > 10) {
          const key = randInt(1, 100);
          node.type = 'BinaryExpression';
          node.operator = '^';
          node.left = { type: 'Literal', value: node.value ^ key };
          node.right = { type: 'Literal', value: key };
        }
      }
    });
  }
}