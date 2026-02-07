export const isStr = (n) => n.type === 'Literal' && typeof n.value === 'string';
export const block = (body) => ({ type: 'BlockStatement', body });