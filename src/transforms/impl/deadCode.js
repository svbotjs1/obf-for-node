import { randName, randInt } from '../../utils/random.js';
export class DeadCode {
  run(ast) {
    const node = {
      type: 'IfStatement',
      test: { type: 'BinaryExpression', operator: '===', left: { type: 'Literal', value: randInt(0,50) }, right: { type: 'Literal', value: randInt(51,100) } },
      consequent: { type: 'BlockStatement', body: [] },
      alternate: null
    };
    if (ast.body) ast.body.splice(Math.floor(Math.random() * ast.body.length), 0, node);
  }
}