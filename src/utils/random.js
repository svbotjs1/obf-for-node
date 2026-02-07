export const hex = (str) => str.split('').map(c => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
export const randName = (len=6) => {
  const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
  return '_' + Array.from({length: len}, () => c[Math.floor(Math.random() * c.length)]).join('');
};
export const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;