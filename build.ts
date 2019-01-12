import * as path from 'path';
import * as util from 'util';
import * as fs from 'fs';

import { rollup } from 'rollup';
import { clean, mkdirp } from './src/file';

const typescript2 = require('rollup-plugin-typescript2');
const resolve = require('rollup-plugin-node-resolve');

const copyFileAsync = util.promisify(fs.copyFile)

const rollupConfig = {
  inputOptions: {
    treeshake: true,
    input: 'src/file.ts',
    external: [ 'fs', 'util', 'path', 'minimatch' ],
    plugins: [
      typescript2({
        tsconfigDefaults: { 
          compilerOptions: { target: 'es6', module: 'esNext' } 
        },
        check: false,
        cacheRoot: path.join(path.resolve(), 'node_modules/.tmp/.rts2_cache'), 
        useTsconfigDeclarationDir: true
      }),
      resolve()
    ],
    onwarn (warning) {
      if (warning.code === 'THIS_IS_UNDEFINED') { return; }
      console.log("Rollup warning: ", warning.message);
    }
  },
  outputOptions: {
    sourcemap: false,
    exports: 'named',
    file: 'dist/aria-fs.js',
    name: 'aria-fs', 
    format: 'cjs'
  }
}

function rollupBuild({ inputOptions, outputOptions }): Promise<any> {
  return rollup(inputOptions).then(bundle => bundle.write(outputOptions));
}

const miscFiles = [ 'package.json', 'README.md' ]

clean('dist')
  .then(() => {
    mkdirp('dist')
    return Promise.all([ 
      rollupBuild(rollupConfig),  
      Promise.all(miscFiles.map(file => copyFileAsync(file, `dist/${file}`)))
    ])
  })