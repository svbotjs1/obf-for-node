export class AntiDebug {
  run(ast) {
    ast.body.unshift({
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { type: 'FunctionExpression', params: [], body: {
          type: 'BlockStatement',
          body: [{
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'setInterval' },
            arguments: [{
              type: 'ArrowFunctionExpression', params: [],
              body: { type: 'BlockStatement', body: [{ type: 'DebuggerStatement' }] }
            }, { type: 'Literal', value: 4000 }]
          }]
        }}, arguments: []
      }
    });
  }
}