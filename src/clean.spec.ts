import * as fs from 'fs'
import * as path from 'path'
import * as mock from 'mock-fs'
import * as sinon from 'sinon'

import { expect } from 'aria-mocha'
import { clean } from './clean'

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