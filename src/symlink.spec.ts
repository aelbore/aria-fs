import * as sinon from 'sinon'
import { resolve, dirname } from 'path'
import { promises, existsSync, lstatSync } from 'fs'
import { expect } from 'aria-mocha'

import { clean } from './clean'
import { unlinkFile, unlinkDir, symlinkDir, symlinkFile } from './symlink'

describe('unlink', () => {

  beforeEach(async () => {
    const folders = [ '.tmp/dir', 'dest/dir' ]
    await Promise.all(folders.map(async folder => {
      await promises.mkdir(folder, { recursive: true })
    }))
  })

  afterEach(async() => {
    sinon.restore()
    await Promise.all([ clean('.tmp'), clean('dest') ])
  })

  it('should unlink remove/delete existing file.', async () => {
    await promises.writeFile('./dest/dir/file.ts', '')
    await unlinkFile('./dest/dir/file.ts')
    
    const exist = existsSync('./dest/dir/file.ts')
    expect(exist).toBeFalse()
  })

  it('should unlink remove/delete existing folder', async () => {
    const dest = resolve('dest/dir')

    await unlinkDir(dest)

    expect(existsSync(dest)).toBeFalse()
  })

  it('should unlink existing symboliclink folder', async () => {
    const src = resolve('.tmp/dir')
    const dest = resolve('dest/dir')

    await clean(dest)
    await promises.symlink(src, dest, 'dir')

    await unlinkDir(dest)

    expect(existsSync(dest)).toBeFalse()
  })

  it('should not unlink or delete not existing folder.', async () => {
    const fs = await import('fs')
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
    await Promise.all([ 
      promises.mkdir(SRC, { recursive: true }), 
      promises.mkdir(DEST, { recursive: true }) 
    ])
  })

  afterEach(async() => {
    await Promise.all([ clean(dirname(SRC)), clean(dirname(DEST)) ])
    sanbox.restore()
  })
  
  it('should create symboliclink.', async () => { 
    const dest = resolve(DEST)
    
    await symlinkDir(SRC, dest)

    expect(lstatSync(dest).isSymbolicLink()).toBeTrue()
  })

  it('should create symboliclink file', async () => {
    const dest = resolve('./dest/dir/file.ts');
    const src = resolve('./.tmp/dir/file.ts')

    await symlinkFile(src, dest);

    expect(lstatSync(dest).isSymbolicLink()).toBeTrue()
  })

  it('should create symboliclink in win32.', async () => {
    const dest = resolve(DEST);

    sanbox.stub(process, 'platform').value('win32');    

    await symlinkDir(SRC, dest);

    expect(lstatSync(dest).isSymbolicLink()).toBeTrue()
  })

})