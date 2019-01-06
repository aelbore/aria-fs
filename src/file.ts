import * as fs from 'fs';
import * as path from 'path';

import * as fsAsync from './file-async';

const minimatch = require('minimatch');

interface GlobFileOptions {
  dir: string;
  isRecursive: boolean;
  pattern: string;
}

async function walkAsync(options: GlobFileOptions): Promise<string[]> {
  const rootDir = path.resolve(options.dir);
  const directories = await fsAsync.readdirAsync(options.dir);
  return Promise.all(directories.map(async directory => {
    const files: string[] = [], result = path.join(rootDir, directory)
    const stats = await fsAsync.statAsync(result);
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
  .then(results => results.join(',').split(','))
}

function mkdirp(directory: string) {
  const dirPath = path.resolve(directory).replace(/\/$/, '').split(path.sep);
  for (let i = 1; i <= dirPath.length; i++) {
    const segment = dirPath.slice(0, i).join(path.sep);
    if (!fs.existsSync(segment) && segment.length > 0) {
      fs.mkdirSync(segment);
    }
  }
}

async function clean(dir: string) {
  if (fs.existsSync(dir)) {
    const files = await fsAsync.readdirAsync(dir);
    await Promise.all(files.map(async file => {
      const p = path.join(dir, file);
      const stat = await fsAsync.lstatAsync(p);
      if (stat.isDirectory()) {
        await clean(p)
      } else {
        fsAsync.unlinkAsync(p)
      }
    }))
    await fsAsync.rmdirAsync(dir);
  }
}

export { globFiles, mkdirp, clean }