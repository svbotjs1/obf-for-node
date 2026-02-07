import { shuffle, randName } from '../../utils/random.js';
export class ControlFlow {
  run(ast) {
    const visit = (n) => {
      if ((n.type === 'FunctionDeclaration' || n.type === 'ArrowFunctionExpression') && n.body.body.length > 3) {
        const body = n.body.body;
        const keys = shuffle(body.map((_, i) => i));
        const sVar = randName(3);
        const cases = keys.map(k => ({
          type: 'SwitchCase', test: { type: 'Literal', value: k },
          consequent: [body[k], { type: 'BreakStatement' }]
        }));
        
        n.body.body = [{
          type: 'VariableDeclaration', kind: 'const',
          declarations: [{
            type: 'VariableDeclarator', id: { type: 'Identifier', name: '_k' },
            init: { type: 'CallExpression', callee: { property: { name: 'split' }, object: { value: keys.join('|'), type: 'Literal' } }, arguments: [{ value: '|', type: 'Literal' }] }
          }]
        }, {
          type: 'VariableDeclaration', kind: 'let',
          declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: sVar }, init: { value: 0, type: 'Literal' } }]
        }, {
          type: 'WhileStatement', test: { value: true, type: 'Literal' },
          body: {
            type: 'BlockStatement',
            body: [{
              type: 'SwitchStatement',
              discriminant: { type: 'UnaryExpression', operator: '+', argument: { type: 'MemberExpression', object: { name: '_k', type: 'Identifier' }, property: { type: 'UpdateExpression', operator: '++', argument: { name: sVar, type: 'Identifier' } }, computed: true } },
              cases: cases
            }, {
              type: 'IfStatement', test: { type: 'BinaryExpression', operator: '==', left: { name: sVar, type: 'Identifier' }, right: { value: keys.length, type: 'Literal' } },
              consequent: { type: 'BreakStatement' }
            }]
          }
        }];
      }
      for(const k in n) if(typeof n[k]==='object'&&n[k]) { if(Array.isArray(n[k])) n[k].forEach(visit); else visit(n[k]); }
    };
    visit(ast);
  }
}