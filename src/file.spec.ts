import * as path from 'path';
import * as mock from 'mock-fs';

import { expect } from 'chai';

import { globFiles } from './file';

describe('File', () => {

  beforeEach(() => {
    mock({
      'src/app': {
        'app.element.ts': `
          import { CustomElement } from 'custom-elements-ts';  
        `,
        'app.element.html': `
          <div class="container"></div>
        `,
        'app.element.scss': `
          :host { }        
        `,
        'index.ts': `
          export * from './app.element';
        `,
        'package.json': ''
      }
    })
  })

  afterEach(() => {
    mock.restore();
  })

  it('should list all files.', async () => {
    const actual = [ `app.element.ts`, `index.ts` ]
      .map(file => path.resolve(`src/app/${file}`));

    const files = await globFiles('src/**/*.ts');
    
    expect(files.length).equal(actual.length);
    for (let value of actual) {
      expect(files.indexOf(value)).not.equal(-1);
    }
  })


})