import { build } from 'esbuild';
for (const file of ['api','uploads']) {
  await build({
    entryPoints: [`backend/neon/${file}.js`],
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'esm',
    outfile: `dist/${file}/index.mjs`,
    external: ['pg-native'],
    logLevel: 'info'
  });
}
