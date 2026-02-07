export class AntiDebugTransformer {
  transform(ast) {
    const d = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'FunctionExpression', params: [],
          body: {
            type: 'BlockStatement',
            body: [{
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'setInterval' },
              arguments: [{
                type: 'ArrowFunctionExpression', params: [],
                body: { type: 'BlockStatement', body: [{ type: 'DebuggerStatement' }] }
              }, { type: 'Literal', value: 4000 }]
            }]
          }
        }, arguments: []
      }
    };
    ast.body.unshift(d);
  }
}