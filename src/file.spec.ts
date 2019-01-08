import * as path from 'path';
import * as fs from 'fs';
import * as mock from 'mock-fs';
import * as sinon from 'sinon';

import { expect } from 'chai';
import { globFiles, mkdirp, clean, copyFiles } from './file';

const MOCK_DATA_DIRS = {
  "src/app": {
    "app.element.ts": `import { CustomElement } from 'custom-elements-ts';`,
    "app.element.html": `<div class="container"></div>`,
    "app.element.scss": `:host { }`,
    "index.ts": `export * from './app.element';`,
    "package.json": ''
  },
  'src/elements/input/src': {
    "index.ts": "export * from './input.element';",
    "input.element.ts": `export class ARInputElement extends HTMLElement { }`,
    "input.element.html": `<div class="ar-form-group ar-material-inputs"></div>`,
    "input.element.scss": `:host { }`,
    "input.element.spec.ts": "import './input.element';"
  },
  "src/elements/input/package.json": `{ "name": "input" }`
}

describe('globFiles', () => {
  beforeEach(() => {
    mock(MOCK_DATA_DIRS)
  })

  afterEach(() => {
    mock.restore()
  })

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

describe('mkdirp', () => {
  afterEach(() => {
    sinon.restore();
  })

  it('should create .tmp directory.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('.tmp');

    expect(mkdirSyncStub.called).to.true;
  })

  it('should create multiple folders.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('.tmp/elements/input');

    expect(mkdirSyncStub.callCount).equal(3);
  })

  it('should not create existing directory.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('src');
    
    expect(mkdirSyncStub.notCalled).to.true;
  })

})

describe('clean', () => {
  beforeEach(() => {
    mock({
      "to-be-delete-folder": { },
      "recursive-folder/src": {
        "sub-dir": {
          "sub-dir-file.ts": ""
        },
        "file.ts": ""
      }
    })
  })

  afterEach(() => {
    mock.restore()
    sinon.restore()
  })

  it('should folder not exist.', async () => {
    const existFileStub = sinon.stub(fs, 'existsSync').returns(false);
    await clean('folder-not-exist');

    expect(existFileStub.called).to.true;
  })

  it('should delete folder.', async () => {    
    await clean('to-be-delete-folder');
    
    mock.restore()
    expect(fs.existsSync("to-be-delete-folder")).to.false;
  })

  it('should delete files and folders (recursive).', async () => {
    const rootFolder = 'recursive-folder';

    await clean(rootFolder)
    mock.restore()

    expect(fs.existsSync(path.join(rootFolder, 'src', 'sub-dir', 'sub-dir-file.ts'))).to.false
    expect(fs.existsSync(path.join(rootFolder, 'src', 'sub-dir'))).to.false
    expect(fs.existsSync(path.join(rootFolder, 'src', 'file.ts'))).to.false
    expect(fs.existsSync(path.join(rootFolder, 'src'))).to.false
    expect(fs.existsSync(rootFolder)).to.false
  })

})

describe('copyFiles', () => {

  beforeEach(() => {
    mock({
      ...MOCK_DATA_DIRS,
      "copy-files-dir": {
        "package.json": ""
      },
      "dest-folder": { }
    })
  })

  afterEach(() => {
    mock.restore()
  })

  it('should copy files.', async () => {
    await copyFiles('copy-files-dir/*', 'dest-folder');

    expect(fs.existsSync('dest-folder/package.json')).to.true
  })

  it('should copy multiple files to non existing dest (recursive).', async () => {
    const destRootDir = ".tmp";

    await copyFiles([ 'src/elements/**/*.ts', 'src/elements/**/*.json' ], destRootDir);

    const files = [
      '.tmp/elements/input/src/index.ts',
      '.tmp/elements/input/src/input.element.ts',
      '.tmp/elements/input/src/input.element.spec.ts',
      '.tmp/elements/input/package.json'
    ]
      
    expect(fs.existsSync(destRootDir)).to.true
    for (const file of files) {
      expect(fs.existsSync(file)).to.true;
    }
  })

})