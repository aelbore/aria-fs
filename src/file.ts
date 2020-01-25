import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

const minimatch = require('minimatch')

const readdirAsync = util.promisify(fs.readdir)
const rmdirAsync = util.promisify(fs.rmdir)
const statAsync = util.promisify(fs.stat)
const lstatAsync = util.promisify(fs.lstat)
const unlinkAsync = util.promisify(fs.unlink)
const copyFileAsync = util.promisify(fs.copyFile)
const symlinkAsync = util.promisify(fs.symlink)

const LINK_TYPE = Object.freeze({
  FILE: 'file',
  DIR: 'dir',
  JUNCTION: 'junction'
})

export interface GlobFileOptions {
  dir: string;
  isRecursive: boolean;
  pattern: string;
  relative?: boolean
}

async function walkAsync(options: GlobFileOptions): Promise<string[]> {
  const { resolve, relative, sep, join } = path
  const rootDir = resolve(options.dir)
  const directories = await readdirAsync(options.dir)
  return Promise.all(directories.map(async directory => {
    const files: string[] = [], result = join(rootDir, directory)
    const stats = await statAsync(result)
    if (stats.isDirectory() && options.isRecursive) {
      const values = await walkAsync({
        ...options,
        dir: result
      })
      for (let i = 0; i < values.length; i++) {
        const value = options.relative 
            ? '.' + sep + relative(resolve(), values[i])
            : values[i]  
        files.push(value)
      }
    }
    if (stats.isFile()) {
      if (minimatch(path.basename(result), options.pattern)) {
        files.push(result)
      }
    }
    return files
  }))
  .then(dirs => dirs.join(',').split(','))
  .then(dirs => dirs.filter(dir => dir))
}

async function globFiles(src: string | string[], relative?: boolean): Promise<string[]> {
  const files: string[] = Array.isArray(src) ? src : [ src ];
  return Promise.all(files.map(file => {
    const options: GlobFileOptions = {
      dir: path.dirname(path.resolve(file).replace(path.sep + '**', '')),
      isRecursive: file.includes('**'),
      pattern: path.basename(file),
      relative
    }
    return walkAsync(options)
  }))
  .then(results => results.join(',').split(','))
  .then(results => results.filter(result => result))
}

async function clean(dir: string): Promise<void> {
  if (fs.existsSync(dir)) {
    const files = await readdirAsync(dir);
    await Promise.all(files.map(async file => {
      const p = path.join(dir, file);
      const stat = await lstatAsync(p);
      if (stat.isDirectory()) {
        await clean(p)
      } else {
        await unlinkAsync(p)
      }
    }))
    await rmdirAsync(dir);
  }
}

async function copyFiles(src: string | string[], destRootDir: string): Promise<void[]> {
  return globFiles(src).then(files => {
    return Promise.all(files.map(file => {
      const srcRootDir = file.replace(path.resolve() + path.sep, '').split(path.sep)[0];
      const destPath = file.replace(srcRootDir, destRootDir);
      mkdirp(path.dirname(destPath));
      return copyFileAsync(file, destPath);
    }))
  });
}

async function symlinkDir(src: string, dest: string): Promise<void> {
  const source = path.resolve(src), destination = path.resolve(dest);
  return unlinkDir(destination).then(() => {
    return symlinkAsync(source, destination, 
      (process.platform === 'win32') ? LINK_TYPE.JUNCTION: LINK_TYPE.DIR) 
  })
}

async function unlinkDir(dest: string): Promise<void> {
  const destination = path.resolve(dest);
  if (fs.existsSync(destination)) {
    const stat = await lstatAsync(destination);
    if (stat.isDirectory()) {
      await clean(destination)
    }
    if (stat.isSymbolicLink()) {
      await unlinkAsync(destination);
    }
  }
}

function mkdirp(directory: string): void {
  const dirPath = path.resolve(directory).replace(/\/$/, '').split(path.sep);
  for (let i = 1; i <= dirPath.length; i++) {
    const segment = dirPath.slice(0, i).join(path.sep);
    if (!fs.existsSync(segment) && segment.length > 0) {
      fs.mkdirSync(segment);
    }
  }
}

export { globFiles, mkdirp, clean, copyFiles, symlinkDir, unlinkDir }