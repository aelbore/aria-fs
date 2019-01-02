import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const minimatch = require('minimatch');

const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);

interface GlobFileOptions {
  dir: string;
  isRecursive: boolean;
  pattern: string;
}

async function walkAsync(options: GlobFileOptions): Promise<string[]> {
  const rootDir = path.resolve(options.dir);
  const directories = await readdirAsync(options.dir);
  return Promise.all(directories.map(async directory => {
    const files: string[] = [], result = path.join(rootDir, directory)
    const stats = await statAsync(result);
    if (stats.isDirectory() && options.isRecursive) {
      const values = await walkAsync({
        dir: result,
        isRecursive: options.isRecursive,
        pattern: options.pattern
      });
      for (let i = 0; i < values.length; i++) {
        files.push(values[i]);
      }
    }
    if (stats.isFile()) {
      if (minimatch(path.basename(result), options.pattern)) {
        files.push(result);
      }
    }
    return files;
  }))
  .then(dirs => dirs.join(',').split(','))
  .then(dirs => dirs.filter(dir => dir))
}

async function globFiles(src: string | string[]): Promise<string[]> {
  const files: string[] = Array.isArray(src) ? src : [ src ];
  return Promise.all(files.map(file => {
    const options: GlobFileOptions = {
      dir: path.dirname(path.resolve(file).replace(path.sep + '**', '')),
      isRecursive: file.includes('**'),
      pattern: path.basename(file)
    }
    return walkAsync(options)
  }))
  .then(results => results.join(',').split(','));
}

export { globFiles }