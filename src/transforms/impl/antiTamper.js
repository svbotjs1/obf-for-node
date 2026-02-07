import { randName } from '../../utils/random.js';
export class AntiTamperTransformer {
  transform(ast) {
    const check = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { type: 'FunctionExpression', params: [], body: {
          type: 'BlockStatement',
          body: [{
            type: 'TryStatement',
            block: {
              type: 'BlockStatement',
              body: [{
                type: 'IfStatement',
                test: {
                  type: 'BinaryExpression', operator: '===',
                  left: { type: 'CallExpression', callee: { type: 'MemberExpression', object: { type: 'MemberExpression', object: { type: 'Identifier', name: 'Function' }, property: { type: 'Identifier', name: 'prototype' } }, property: { type: 'Identifier', name: 'toString' } }, property: { type: 'Identifier', name: 'call' } }, arguments: [{ type: 'Identifier', name: 'console.log' }] },
                  right: { type: 'CallExpression', callee: { type: 'MemberExpression', object: { type: 'MemberExpression', object: { type: 'Identifier', name: 'Function' }, property: { type: 'Identifier', name: 'prototype' } }, property: { type: 'Identifier', name: 'toString' } }, property: { type: 'Identifier', name: 'call' } }, arguments: [{ type: 'Identifier', name: 'console.log' }] }
                },
                consequent: { type: 'BlockStatement', body: [] },
                alternate: { type: 'BlockStatement', body: [{ type: 'WhileStatement', test: { type: 'Literal', value: true }, body: { type: 'BlockStatement', body: [] } }] }
              }]
            },
            handler: null, finalizer: null
          }]
        } },
        arguments: []
      }
    };
    ast.body.unshift(check);
  }
}