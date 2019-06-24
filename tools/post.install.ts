import * as path from 'path'
import * as util from 'util'
import { exec } from 'child_process'
import { symlinkDir, getPackageJson } from 'aria-build'

(async function() {
  delete process.env.APP_ROOT_PATH

  const execute = util.promisify(exec)

  const rootDirs = [
    './packages/aria-mocha'
  ]

  await Promise.all(rootDirs.map(async rootDir => {
    process.env.APP_ROOT_PATH = path.resolve(rootDir)
    const pkg = getPackageJson()
    await symlinkDir(
      path.resolve('node_modules'), 
      path.join(process.env.APP_ROOT_PATH, 'node_modules')
    ) 
    await execute(`npm run build --prefix ${rootDir}`)
    await symlinkDir(
      path.resolve(path.join(rootDir, 'dist')),
      path.resolve(path.join(rootDir, 'node_modules', pkg.name))
    )
  }))

})()