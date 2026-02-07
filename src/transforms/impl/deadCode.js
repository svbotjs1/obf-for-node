import { randName, randInt } from '../../utils/random.js';
export class DeadCodeTransformer {
  transform(ast) {
    const junk = {
      type: 'IfStatement',
      test: { type: 'BinaryExpression', operator: '===', left: { type: 'Literal', value: randInt(0,100) }, right: { type: 'Literal', value: randInt(101,200) } },
      consequent: {
        type: 'BlockStatement',
        body: [{
          type: 'ExpressionStatement',
          expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'console.log' }, arguments: [{ type: 'Literal', value: randName(50) }] }
        }]
      },
      alternate: null
    };
    if (ast.body) ast.body.splice(Math.floor(Math.random() * ast.body.length), 0, junk);
  }
}