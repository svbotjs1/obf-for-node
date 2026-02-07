# obf-for-node

Advanced JavaScript Obfuscator for Node.js applications.

## Installation

```bash
npm install -g obf-for-node
```

## CLI Usage

```bash
obf-for-node -f <input> -o <output> [options]
```

| Option | Description |
|--------|-------------|
| `-f, --file` | Input file path (Required) |
| `-o, --output` | Output file path (Required) |
| `--antidebug` | Inject anti-debugging loops |
| `--antitamper` | Inject function integrity checks |
| `--compact` | Minify output |
| `--str-array` | Enable String Array encryption |
| `--control-flow` | Enable Control Flow Flattening |

### Example

```bash
obf-for-node -f server.js -o server.obf.js --antidebug --control-flow
```

## API Usage

```javascript
import { obfuscate } from 'obf-for-node';

const code = 'const x = 1;';
const result = obfuscate(code, {
    compact: true,
    antiDebug: true
});
```
