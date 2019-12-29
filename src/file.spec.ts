import * as path from 'path'
import * as fs from 'fs'
import * as mock from 'mock-fs'
import * as sinon from 'sinon'
import * as assert from 'assert'

import { globFiles, mkdirp, clean, copyFiles, unlinkDir, symlinkDir } from './file';

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
    assert.strictEqual(files.length, 1)
  })

  it('should list all files in src directory', async () => {
    const files = await globFiles('src/**/*');
    assert.strictEqual(files.length, 11)
  })

  it('should list all .html and .scss files.', async () => {
    const files = await globFiles([ 'src/**/*.html', 'src/**/*.scss' ]);
    assert.strictEqual(files.length, 4)
  })

  it('should list all .ts files', async () => {
    const appDir = [ `app.element.ts`, `index.ts` ]
      .map(file => path.resolve(`src/app/${file}`));
    const elementsDir = [ "index.ts", "input.element.ts", "input.element.spec.ts" ]
      .map(file => path.resolve(`src/elements/input/src/${file}`));

    const actual = appDir.concat(elementsDir);

    const files = await globFiles('src/**/*.ts');
    
    assert.strictEqual(files.length, actual.length)
    actual.forEach(value => {
      assert.notStrictEqual(files.indexOf(value), -1)
    })
  })

  it('should have empty results.', async () => {
    mock({
      'build': {}
    })

    const files = await globFiles('./build/**/*.ts');
    assert.ok(Array.isArray(files))
    assert.strictEqual(files.length, 0)
  })

})

describe('mkdirp', () => {
  afterEach(() => {
    sinon.restore();
  })

  it('should create .tmp directory.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('.tmp');

    assert.strictEqual(mkdirSyncStub.called, true)
  })

  it('should create multiple folders.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('.tmp/elements/input');

    assert.strictEqual(mkdirSyncStub.callCount, 3)
  })

  it('should not create existing directory.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('src');
    
    assert.strictEqual(mkdirSyncStub.notCalled, true)
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

    assert.strictEqual(existFileStub.called, true)
  })

  it('should delete folder.', async () => {    
    await clean('to-be-delete-folder');
    
    mock.restore()
    assert.strictEqual(fs.existsSync("to-be-delete-folder"), false)
  })

  it('should delete files and folders (recursive).', async () => {
    const rootFolder = 'recursive-folder';

    await clean(rootFolder)
    mock.restore()

    assert.strictEqual(
      fs.existsSync(path.join(rootFolder, 'src', 'sub-dir', 'sub-dir-file.ts')),
      false
    )
    assert.strictEqual(
      fs.existsSync(path.join(rootFolder, 'src', 'sub-dir')),
      false
    )
    assert.strictEqual(
      fs.existsSync(path.join(rootFolder, 'src', 'file.ts')),
      false
    )
    assert.strictEqual(fs.existsSync(path.join(rootFolder, 'src')), false)
    assert.strictEqual(fs.existsSync(rootFolder), false)
  })

})

describe('copyFiles', () => {
  beforeEach(() => {
    mock({
      ...MOCK_DATA_DIRS,
      "copy-files-dir": {
        "package.json": ""
      },
      "dest-folder": { },
      ".tmp": { 
        "elements": {
          "input": {
            "src": { }
          }
        }
      }
    })
  })

  afterEach(() => {
    mock.restore()
  })

  it('should copy files.', async () => {
    await copyFiles('copy-files-dir/*', 'dest-folder');

    assert.strictEqual(fs.existsSync('dest-folder/package.json'), true)
  })

  it('should copy multiple files (recursive).', async () => {
    const destRootDir = ".tmp";

    await copyFiles([ 'src/elements/**/*.ts', 'src/elements/**/*.json' ], destRootDir);
    
    const files = [
      ".tmp/elements/input/src/index.ts",
      ".tmp/elements/input/src/input.element.ts",
      ".tmp/elements/input/src/input.element.spec.ts",
      ".tmp/elements/input/package.json"
    ]

    files.forEach(file => {
      assert.strictEqual(fs.existsSync(file), true)
    })
  })
})

describe('unlinkDir', () => {

  beforeEach(async () => {
    await Promise.all([ mkdirp('.tmp/dir'), mkdirp('dest/dir') ])
  })

  afterEach(async() => {
    await sinon.restore();
    await Promise.all([ clean('.tmp'), clean('dest') ])
  })

  it('should unlink remove/delete existing folder', async () => {
    const dest = path.resolve('dest/dir');

    await unlinkDir(dest);

    assert.strictEqual(fs.existsSync(dest), false)
  })

  it('should unlink existing symboliclink folder', async () => {
    const src = path.resolve('.tmp/dir');
    const dest = path.resolve('dest/dir');

    await clean(dest);
    fs.symlinkSync(src, dest, 'dir');

    await unlinkDir(dest);

    assert.strictEqual(fs.existsSync(dest), false)
  })

  it('should not unlink or delete not existing folder.', async () => {
    const existStub = sinon.stub(fs, 'existsSync').returns(false);

    await unlinkDir('dest/dir');

    assert.strictEqual(existStub.called, true)
  })

})

describe('symlinkDir', () => {
  const SRC = '.tmp/dir', 
    DEST = 'dest/dir', 
    sanbox = sinon.createSandbox()

  beforeEach(async () => {
    await Promise.all([ mkdirp(SRC), mkdirp(DEST) ])
  })

  afterEach(async() => {
    await Promise.all([ clean(path.dirname(SRC)), clean(path.dirname(DEST)) ])
    sanbox.restore()
  })
  
  it('should create symboliclink.', async () => { 
    const dest = path.resolve(DEST);
    
    await symlinkDir(SRC, dest);

    assert.strictEqual(fs.lstatSync(dest).isSymbolicLink(), true)
  })

  it('should create symboliclink in win32.', async () => {
    const dest = path.resolve(DEST);

    sanbox.stub(process, 'platform').value('win32');    

    await symlinkDir(SRC, dest);

    assert.strictEqual(fs.lstatSync(dest).isSymbolicLink(), true)
  })

})
