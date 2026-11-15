import { build } from 'esbuild';
for (const file of ['api','uploads','members']) {
  await build({
    entryPoints: [`backend/neon/${file}.js`],
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'esm',
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
    outfile: `dist/${file}/index.mjs`,
    external: ['pg-native'],
    logLevel: 'info'
  });
}
