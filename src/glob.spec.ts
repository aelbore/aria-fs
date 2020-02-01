import * as mockfs from 'mock-fs'
import * as path from 'path'

import { expect } from 'aria-mocha'
import { globFiles } from './glob'

describe('globFiles', () => {
  
  beforeEach(() => {
    mockfs({
      './src/app.element.ts': '',
      './src/app.element.html': '',
      './src/app.element.scss': '',
      './src/elements/index.ts': ''
    })
  })
  
  afterEach(() => {
    mockfs.restore()
  })

  it('should list all files in src directory (not recursive).', async () => {
    const files = await globFiles('./src/*');
    expect(files.length).equal(3)
  })

  it('should list all files in src directory', async () => {
    const files = await globFiles('./src/**/*');
    expect(files.length).equal(4)
  })

  it('should list all .html and .scss files.', async () => {
    const files = await globFiles([ 'src/**/*.html', 'src/**/*.scss' ]);
    expect(files.length).equal(2)
  })

  it('should list all .ts files output absolute path', async () => {
    const { normalize } = path

    const actual = [ 
      './src/app.element.ts', 
      './src/elements/index.ts' 
    ]

    const files = await globFiles('src/**/*.ts')
    
    expect(files.length).equal(actual.length)
    await Promise.all(actual.map(file => {
      const result = path.resolve(file)
      const value = files.find(value => {
        return normalize(value) === normalize(result)
      })
      expect(value).toBeDefined()
    }))
  })

  it('should list all .ts files output relative path', async () => {
    const { normalize } = path

    const actual = [ 
      './src/app.element.ts', 
      './src/elements/index.ts' 
    ]

    const files = await globFiles('src/**/*.ts', true);
    
    expect(files.length).equal(actual.length)
    await Promise.all(actual.map(file => {
      const value = files.find(value => normalize(value) === normalize(file))
      expect(value).toBeDefined()
    }))
  })

  it('should have empty results.', async () => {
    mockfs({
      'build': {}
    })

    const files = await globFiles('./build/**/*.ts');
    expect(Array.isArray(files)).toBeDefined()
    expect(files.length).equal(0)
  })

})