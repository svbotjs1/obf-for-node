import { shuffle, randName } from '../../utils/random.js';
export class ControlFlowTransformer {
  transform(ast) {
    const visit = (node) => {
      if ((node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') && node.body.body.length > 3) {
        const body = node.body.body;
        const keys = shuffle(body.map((_, i) => i));
        const sVar = randName(3);
        const cases = keys.map(k => ({
          type: 'SwitchCase', test: { type: 'Literal', value: k },
          consequent: [body[k], { type: 'BreakStatement' }]
        }));
        
        node.body.body = [{
          type: 'VariableDeclaration', kind: 'var',
          declarations: [{
            type: 'VariableDeclarator', id: { type: 'Identifier', name: '_seq' },
            init: { type: 'CallExpression', callee: { property: { name: 'split' }, object: { value: keys.join('|'), type: 'Literal' } }, arguments: [{ value: '|', type: 'Literal' }] }
          }]
        }, {
          type: 'VariableDeclaration', kind: 'var',
          declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: sVar }, init: { value: 0, type: 'Literal' } }]
        }, {
          type: 'WhileStatement', test: { value: true, type: 'Literal' },
          body: {
            type: 'BlockStatement',
            body: [{
              type: 'SwitchStatement',
              discriminant: { type: 'UnaryExpression', operator: '+', argument: { type: 'MemberExpression', object: { name: '_seq', type: 'Identifier' }, property: { type: 'UpdateExpression', operator: '++', argument: { name: sVar, type: 'Identifier' } }, computed: true } },
              cases: cases
            }, {
              type: 'IfStatement', test: { type: 'BinaryExpression', operator: '==', left: { name: sVar, type: 'Identifier' }, right: { value: keys.length, type: 'Literal' } },
              consequent: { type: 'BreakStatement' }
            }]
          }
        }];
      }
      for(const k in node) if(typeof node[k]==='object'&&node[k]) { if(Array.isArray(node[k])) node[k].forEach(visit); else visit(node[k]); }
    };
    visit(ast);
  }
}