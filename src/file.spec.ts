import * as path from 'path';
import * as fs from 'fs';
import * as mock from 'mock-fs';
import * as sinon from 'sinon';

import * as fsAsync from './file-async';

import { expect } from 'chai';
import { globFiles, mkdirp, clean } from './file';

describe('File', () => {

  beforeEach(() => {
    mock({
      'src/app': {
        'app.element.ts': `import { CustomElement } from 'custom-elements-ts';`,
        'app.element.html': `<div class="container"></div>`,
        'app.element.scss': `:host { }`,
        'index.ts': `export * from './app.element';`,
        'package.json': ''
      },
      'src/elements/input/src': {
        "index.ts": "export * from './input.element';",
        "input.element.ts": `export class ARInputElement extends HTMLElement { }`,
        "input.element.html": `<div class="ar-form-group ar-material-inputs"></div>`,
        "input.element.scss": `:host { }`,
        "input.element.spec.ts": "import './input.element';"
      },
      "src/elements/input/package.json": `{ "name": "input" }`,
      "to-be-delete-folder": { }
    })
  })

  afterEach(() => {
    mock.restore();
  })

  describe('globFiles', () => {
    it('should list all files in `src/elements/input` directory (not recursive).', async () => {
      const files = await globFiles('src/elements/input/*');
      expect(files.length).equal(1);
    })
  
    it('should list all files in src directory', async () => {
      const files = await globFiles('src/**/*');
      expect(files.length).equal(11);
    })
  
    it('should list all .html and .scss files.', async () => {
      const files = await globFiles([ 'src/**/*.html', 'src/**/*.scss' ]);
      expect(files.length).equal(4);
    })
  
    it('should list all .ts files', async () => {
      const appDir = [ `app.element.ts`, `index.ts` ]
        .map(file => path.resolve(`src/app/${file}`));
      const elementsDir = [ "index.ts", "input.element.ts", "input.element.spec.ts" ]
        .map(file => path.resolve(`src/elements/input/src/${file}`));
  
      const actual = appDir.concat(elementsDir);
  
      const files = await globFiles('src/**/*.ts');
      
      expect(files.length).equal(actual.length);
      for (let value of actual) {
        expect(files.indexOf(value)).not.equal(-1);
      }
    })
  })

  describe('clean', () => {  
    it('should delete folder.', async () => {
      await clean('to-be-delete-folder');
  
      expect(fs.existsSync("to-be-delete-folder")).to.false;
    })
  })

})
