import * as path from 'path';
import * as util from 'util';
import * as fs from 'fs';

import { rollup } from 'rollup';
import { clean } from './src/file';

import MagicString from 'magic-string';

const typescript2 = require('rollup-plugin-typescript2');
const resolve = require('rollup-plugin-node-resolve');

const copyFileAsync = util.promisify(fs.copyFile)
const writeFileAsync = util.promisify(fs.writeFile)
const renameAsync = util.promisify(fs.rename);

const DEST_FOLDER = 'dist';
const ENTRY_FILE = 'src/file.ts'
const MODULE_NAME = 'aria-fs';

const createConfig = () => {
  return [ 'cjs', 'es' ].map(format => {
    const file = (format === 'es') 
      ? path.join(DEST_FOLDER, `${MODULE_NAME}.es.js`)
      : path.join(DEST_FOLDER, `${MODULE_NAME}.js`)

    return {
      inputOptions: {
        treeshake: true,
        input: ENTRY_FILE,
        external: [ 'fs', 'util', 'path', 'minimatch' ],
        plugins: [
          typescript2({
            tsconfigDefaults: { 
              compilerOptions: { 
                target: 'es6', 
                module: 'es2015', 
                declaration: true
              },
              include: [ ENTRY_FILE ]
            },
            check: false,
            cacheRoot: path.join(path.resolve(), 'node_modules/.tmp/.rts2_cache'), 
            useTsconfigDeclarationDir: (format === 'es') ? true: false
          }),
          resolve(),
          stripCode()
        ],
        onwarn (warning) {
          if (warning.code === 'THIS_IS_UNDEFINED') { return; }
          console.log("Rollup warning: ", warning.message);
        }
      },
      outputOptions: {
        sourcemap: false,
        exports: 'named',
        file: file,
        name: MODULE_NAME, 
        format: format
      }
    }    
  })
}

function stripCode () {
  return {
    name: 'stripCode',
    transform (source, id) {
      let code = source.replace(/(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/g, '')
      const magicString = new MagicString(code)
      let map = magicString.generateMap({hires: true})
      return {code, map}
    }
  }
}

async function copyPackageFile() {
  const FILE_NAME = 'package.json';
  const pkg = require(`./${FILE_NAME}`);
  delete pkg.scripts;
  delete pkg.devDependencies;
  delete pkg.nyc;
  return writeFileAsync(`dist/${FILE_NAME}`, JSON.stringify(pkg, null, 2))
}

async function rollupBuild({ inputOptions, outputOptions }): Promise<any> {
  return rollup(inputOptions).then(bundle => bundle.write(outputOptions));
}

clean('dist')
  .then(() => Promise.all(createConfig().map(config => rollupBuild(config))))
  .then(() => {
    return Promise.all([ 
      copyPackageFile(), 
      renameAsync('dist/file.d.ts', 'dist/aria-fs.d.ts'),
      copyFileAsync('README.md', 'dist/README.md'),
    ])
})