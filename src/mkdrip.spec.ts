import * as fs from 'fs'
import * as sinon from 'sinon'

import { expect } from 'aria-mocha' 
import { mkdirp } from './mkdrip';

describe('mkdirp', () => {

  afterEach(() => {
    sinon.restore()
  })

  it('should create .tmp directory.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('.tmp')

    expect(mkdirSyncStub.called).toBeTrue()
  })

  it('should create multiple folders.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('.tmp/elements/input')

    expect(mkdirSyncStub.callCount).equal(3)
  })

  it('should not create existing directory.', () => {
    const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    mkdirp('src')
    
    expect(mkdirSyncStub.notCalled).toBeTrue()
  })

})