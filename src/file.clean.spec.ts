import * as path from 'path';
import * as fs from 'fs';
import * as mock from 'mock-fs';

import { expect } from 'chai';

import { clean } from './file';

const MOCK_DIR_AND_FILES = {
  "src/app": {
    "app.element.ts": `import { CustomElement } from 'custom-elements-ts';`,
    "app.element.html": `<div class="container"></div>`,
    "app.element.scss": `:host { }`,
    "index.ts": `export * from './app.element';`,
    "package.json": ''
  },
  'src/elements/isnput/src': {
    "index.ts": "export * from './input.element';",
    "input.element.ts": `export class ARInputElement extends HTMLElement { }`,
    "input.element.html": `<div class="ar-form-group ar-material-inputs"></div>`,
    "input.element.scss": `:host { }`,
    "input.element.spec.ts": "import './input.element';"
  },
  "src/elements/input/package.json": `{ "name": "input" }`
}

describe('clean', () => {
  beforeEach(() => {
    mock({ 
      ...MOCK_DIR_AND_FILES,
      "to-be-delete-folder": { }
    });
  })

  afterEach(() => {
    mock.restore()
  })

  it('should delete folder.', async () => {
    await clean('to-be-delete-folder');

    expect(fs.existsSync('to-be-delete-folder')).to.false;
  })

  it('should delete folders and files recursive.', async () => {
    await clean('src');

    expect(fs.existsSync(path.resolve('src/app/app.element.ts'))).to.false;
    expect(fs.existsSync(path.resolve('src/app/app.element.html'))).to.false;
    expect(fs.existsSync(path.resolve('src/app/app.element.scss'))).to.false;
    expect(fs.existsSync(path.resolve('src/app/index.ts'))).to.false;
    expect(fs.existsSync(path.resolve('src/app/package.json'))).to.false;
    expect(fs.existsSync(path.resolve('src/app'))).to.false;
    expect(fs.existsSync(path.resolve('src'))).to.false;
  })

})