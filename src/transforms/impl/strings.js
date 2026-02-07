import { walk } from 'estree-walker';
import { hex, randName, randInt } from '../../utils/random.js';
import { isStr } from '../../utils/ast.js';

export class StringTransformer {
  constructor(opts) { this.opts = opts; }
  transform(ast) {
    const strings = [];
    const map = new Map();
    walk(ast, {
      enter: (node) => {
        if (isStr(node) && node.value.length > 2) {
          if (!map.has(node.value)) {
            map.set(node.value, strings.length);
            strings.push(node.value);
          }
          node._idx = map.get(node.value);
          node._skip = true;
        }
      }
    });
    if (!strings.length) return;
    
    const arrName = randName(5);
    const offset = randInt(10, 100);
    
    // String Rotation Logic
    const rotated = [...strings];
    for(let i=0; i<offset; i++) rotated.push(rotated.shift());

    ast.body.unshift({
      type: 'VariableDeclaration', kind: 'const',
      declarations: [{
        type: 'VariableDeclarator', id: { type: 'Identifier', name: arrName },
        init: { type: 'ArrayExpression', elements: rotated.map(s => ({ type: 'Literal', value: s, raw: `'${hex(s)}'` })) }
      }]
    });

    const getter = randName(4);
    ast.body.splice(1, 0, {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: getter },
      params: [{ type: 'Identifier', name: 'i' }],
      body: {
        type: 'BlockStatement',
        body: [{
          type: 'ReturnStatement',
          argument: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: arrName },
            property: { 
              type: 'BinaryExpression', operator: '-', 
              left: { type: 'Identifier', name: 'i' }, 
              right: { type: 'Literal', value: offset } 
            },
            computed: true
          }
        }]
      }
    });

    walk(ast, {
      enter: (node) => {
        if (node._skip) {
          node.type = 'CallExpression';
          node.callee = { type: 'Identifier', name: getter };
          node.arguments = [{ type: 'Literal', value: node._idx + offset }];
          delete node.value; delete node.raw;
        }
      }
    });
  }
}