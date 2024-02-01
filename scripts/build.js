// @ts-check
/// <reference path="./node_modules/esbuild/lib/main.d.ts">
import esbuild from 'esbuild';

/** @type {esbuild.BuildOptions} */
const config = {
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    sourcemap: false,
    target: ['es2020'],
    format: 'esm',
    logLevel: 'info',
    bundle: true,
};

const minConfig = Object.assign({}, config, {
    outfile: 'dist/index.min.js',
    sourcemap: true,
    minify: true,
});

try {    
    esbuild.build(minConfig)
    esbuild.build(config);
} catch(err) {
    throw err;
}