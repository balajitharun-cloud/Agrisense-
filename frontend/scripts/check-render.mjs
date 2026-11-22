import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../.check-build');
const outFile = path.join(outDir, 'ssr-entry.mjs');
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [path.join(__dirname, 'ssr-entry.jsx')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: { '.jsx': 'jsx' },
  outfile: outFile,
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"
  },
  logLevel: 'warning',
  target: 'node18'
});

await import(outFile);
