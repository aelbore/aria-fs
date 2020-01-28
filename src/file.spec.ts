import * as path from 'path'
import * as fs from 'fs'
import * as mock from 'mock-fs'
import * as sinon from 'sinon'

import { expect } from 'aria-mocha' 
import { globFiles, mkdirp, clean, copyFiles, unlinkDir, symlinkDir, unlinkFile, symlinkFile } from './file'

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
    expect(files.length).equal(1)
  })

  it('should list all files in src directory', async () => {
    const files = await globFiles('src/**/*');
    expect(files.length).equal(11)
  })

  it('should list all .html and .scss files.', async () => {
    const files = await globFiles([ 'src/**/*.html', 'src/**/*.scss' ]);
    expect(files.length).equal(4)
  })

  it('should list all .ts files', async () => {
    const appFiles = [ 'app.element.ts', 'index.ts' ].map(file => `src/app/${file}`)
    const appDir = appFiles.map(file => path.resolve(file))

    const elementFiles = [ 
      "index.ts", 
      "input.element.ts", 
      "input.element.spec.ts" 
    ].map(file => `src/elements/input/src/${file}`)
    const elementsDir = elementFiles.map(file => path.resolve(file))

    const actual = appDir.concat(elementsDir);
    const files = await globFiles('src/**/*.ts');
    
    expect(files.length).equal(actual.length)
    actual.forEach(value => {
      expect(files.indexOf(value)).notEqual(-1)
    })
  })

  it('should list all .ts files output relative path', async () => {
    const appFiles = [ 
      'app.element.ts', 'index.ts' 
    ].map(file => `./src/app/${file}`)
    const elementFiles = [ 
      "index.ts", 
      "input.element.ts", 
      "input.element.spec.ts" 
    ].map(file => `./src/elements/input/src/${file}`)

    const actual = appFiles.concat(elementFiles);
    const files = await globFiles('src/**/*.ts', true);
    
    expect(files.length).equal(actual.length)
    actual.forEach(file => {
      expect(files.indexOf(file)).notEqual(-1)
    })
  })

  it('should have empty results.', async () => {
    mock({
      'build': {}
    })

    const files = await globFiles('./build/**/*.ts');
    expect(Array.isArray(files)).toBeDefined()
    expect(files.length).equal(0)
  })

})

describe('mkdirp', () => {
  afterEach(() => {
    sinon.restore();
  })

  it('should create .tmp directory.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('.tmp');

    expect(mkdirSyncStub.called).toBeTrue()
  })

  it('should create multiple folders.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('.tmp/elements/input');

    expect(mkdirSyncStub.callCount).equal(3)
  })

  it('should not create existing directory.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('src');
    
    expect(mkdirSyncStub.notCalled).toBeTrue()
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

    expect(existFileStub.called).toBeTrue()
  })

  it('should delete folder.', async () => {    
    await clean('to-be-delete-folder');
    
    mock.restore()
    expect(fs.existsSync("to-be-delete-folder")).toBeFalse()
  })

  it('should delete files and folders (recursive).', async () => {
    const rootFolder = 'recursive-folder';

    await clean(rootFolder)
    mock.restore()

    expect(fs.existsSync(path.join(rootFolder, 'src', 'sub-dir', 'sub-dir-file.ts'))).toBeFalse()
    expect(fs.existsSync(path.join(rootFolder, 'src', 'sub-dir'))).toBeFalse()
    expect(fs.existsSync(path.join(rootFolder, 'src', 'file.ts'))).toBeFalse()
    expect(fs.existsSync(path.join(rootFolder, 'src'))).toBeFalse()
    expect(fs.existsSync(rootFolder)).toBeFalse()
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

    expect(fs.existsSync('dest-folder/package.json')).toBeTrue()
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
      expect(fs.existsSync(file)).toBeTrue()
    })
  })
})

describe('unlink', () => {

  beforeEach(async () => {
    await Promise.all([ mkdirp('.tmp/dir'), mkdirp('dest/dir') ])
  })

  afterEach(async() => {
    await sinon.restore()
    await Promise.all([ clean('.tmp'), clean('dest') ])
  })

  it('should unlin remove/delete existing file.', async () => {
    await fs.promises.writeFile('./dest/dir/file.ts', '')
    await unlinkFile('./dest/dir/file.ts')
    
    const exist = fs.existsSync('./dest/dir/file.ts')
    expect(exist).toBeFalse()
  })

  it('should unlink remove/delete existing folder', async () => {
    const dest = path.resolve('dest/dir')

    await unlinkDir(dest)

    expect(fs.existsSync(dest)).toBeFalse()
  })

  it('should unlink existing symboliclink folder', async () => {
    const src = path.resolve('.tmp/dir')
    const dest = path.resolve('dest/dir')

    await clean(dest)
    fs.symlinkSync(src, dest, 'dir')

    await unlinkDir(dest)

    expect(fs.existsSync(dest)).toBeFalse()
  })

  it('should not unlink or delete not existing folder.', async () => {
    const existStub = sinon.stub(fs, 'existsSync').returns(false);

    await unlinkDir('dest/dir');

    expect(existStub.called).toBeTrue()
  })

})

describe('symlink', () => {
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

    expect(fs.lstatSync(dest).isSymbolicLink()).toBeTrue()
  })

  it('should create symboliclink file', async () => {
    const dest = path.resolve('./dest/dir/file.ts');
    const src = path.resolve('./.tmp/dir/file.ts')

    await symlinkFile(src, dest);

    expect(fs.lstatSync(dest).isSymbolicLink()).toBeTrue()
  })

  it('should create symboliclink in win32.', async () => {
    const dest = path.resolve(DEST);

    sanbox.stub(process, 'platform').value('win32');    

    await symlinkDir(SRC, dest);

    expect(fs.lstatSync(dest).isSymbolicLink()).toBeTrue()
  })

})
