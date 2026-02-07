import { walk } from 'estree-walker';
import { hex, randName, randInt } from '../../utils/random.js';
import { isStr } from '../../utils/ast.js';

export class StringTransformer {
  run(ast) {
    const pool = [];
    const map = new Map();
    walk(ast, {
      enter: (n) => {
        if (isStr(n) && n.value.length > 2) {
          if (!map.has(n.value)) {
            map.set(n.value, pool.length);
            pool.push(n.value);
          }
          n._idx = map.get(n.value);
          n._skip = true;
        }
      }
    });
    if (!pool.length) return;
    
    const arrName = randName(5);
    const shift = randInt(5, 20);
    const rotated = [...pool];
    for(let i=0; i<shift; i++) rotated.push(rotated.shift());

    ast.body.unshift({
      type: 'VariableDeclaration', kind: 'const',
      declarations: [{
        type: 'VariableDeclarator', id: { type: 'Identifier', name: arrName },
        init: { type: 'ArrayExpression', elements: rotated.map(s => ({ type: 'Literal', value: s, raw: `'${hex(s)}'` })) }
      }]
    });

    const decName = randName(4);
    ast.body.splice(1, 0, {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: decName },
      params: [{ type: 'Identifier', name: 'i' }],
      body: {
        type: 'BlockStatement',
        body: [{
          type: 'ReturnStatement',
          argument: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: arrName },
            property: { type: 'BinaryExpression', operator: '-', left: { type: 'Identifier', name: 'i' }, right: { type: 'Literal', value: shift } },
            computed: true
          }
        }]
      }
    });

    walk(ast, {
      enter: (n) => {
        if (n._skip) {
          n.type = 'CallExpression';
          n.callee = { type: 'Identifier', name: decName };
          n.arguments = [{ type: 'Literal', value: n._idx + shift }];
          delete n.value; delete n.raw;
        }
      }
    });
  }
}