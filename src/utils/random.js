export const hex = (str) => str.split('').map(c => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
export const randName = (len=6) => '_' + Math.random().toString(36).substring(2, 2+len);
export const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;