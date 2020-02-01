import * as fs from 'fs'
import * as mock from 'mock-fs'

import { expect } from 'aria-mocha'
import { copyFiles } from './copy'

describe('copyFiles', () => {
  
  beforeEach(() => {
    mock({
      'src/elements/input/src': {
        "index.ts": "",
        "input.element.ts": '',
        "input.element.html": '',
        "input.element.scss": '',
        "input.element.spec.ts": '',
      },
      'src/elements/input/package.json': '',
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
    const files = [
      ".tmp/elements/input/src/index.ts",
      ".tmp/elements/input/src/input.element.ts",
      ".tmp/elements/input/src/input.element.spec.ts",
      ".tmp/elements/input/package.json"
    ]
    
    await copyFiles([ 
      './src/elements/**/*.ts', './src/elements/**/*.json' 
    ], '.tmp')

    await Promise.all(files.map(file => {
      expect(fs.existsSync(file)).toBeTrue()
    }))
  })
})