export const isStr = (n) => n.type === 'Literal' && typeof n.value === 'string';
export const createCall = (name, args) => ({
  type: 'CallExpression',
  callee: { type: 'Identifier', name },
  arguments: args
});