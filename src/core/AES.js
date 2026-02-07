import crypto from 'node:crypto';
export class AES {
  static encrypt(code, kRaw) {
    const k = crypto.createHash('sha256').update(kRaw).digest();
    const iv = crypto.randomBytes(16);
    const c = crypto.createCipheriv('aes-256-cbc', k, iv);
    let e = c.update(code, 'utf8', 'hex');
    e += c.final('hex');
    return `import c from 'node:crypto';
const k = process.env.VXK_KEY;
if(!k)process.exit(1);
const h = c.createHash('sha256').update(k).digest();
const i = Buffer.from('${iv.toString('hex')}', 'hex');
const d = c.createDecipheriv('aes-256-cbc', h, i);
let s = d.update('${e}', 'hex', 'utf8');
s += d.final('utf8');
const m = new module.constructor();
m.paths = module.paths;
m._compile(s, 'vxk');`;
  }
}