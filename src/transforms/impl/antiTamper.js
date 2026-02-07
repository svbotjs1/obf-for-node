export class AntiTamper {
  run(ast) {
    ast.body.unshift({
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { type: 'FunctionExpression', params: [], body: {
          type: 'BlockStatement',
          body: [{
            type: 'IfStatement',
            test: {
              type: 'BinaryExpression', operator: '!==',
              left: { type: 'CallExpression', callee: { type: 'MemberExpression', object: { type: 'CallExpression', callee: { type: 'MemberExpression', object: { type: 'Identifier', name: 'console' }, property: { type: 'Identifier', name: 'log' } } }, property: { type: 'Identifier', name: 'toString' } } },
              right: { type: 'Literal', value: '[object Object]' } 
            },
            consequent: { type: 'BlockStatement', body: [] } 
          }]
        }}, arguments: []
      }
    });
  }
}