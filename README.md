[![Coverage Status](https://coveralls.io/repos/github/aelbore/aria-fs/badge.svg?branch=master)](https://coveralls.io/github/aelbore/aria-fs?branch=master)
[![Build Status](https://travis-ci.org/aelbore/aria-fs.svg?branch=master)](https://travis-ci.org/aelbore/aria-fs)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

# aria-fs

* `globFiles` - return promise of string array of file paths matching one or more globs.
  - `globFiles(<globs>): Promise<string>`
  <br />
  
  ```js
  const { globFiles } = require('aria-fs');

  (async function(){
    const files = await globFiles('src/**/*.ts');
  })();
  ```
