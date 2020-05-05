import { relative, sep, join, resolve, basename, normalize } from 'path'
import { promises } from 'fs'

const minimatch = require('minimatch')

type GlobFileOptions = {
  dir: string;
  isRecursive: boolean;
  pattern: string;
  relative?: boolean
}

function createOptions(file: string, relative: boolean) { 
  const options: GlobFileOptions = { 
     dir:  file.replace(/(\*.*)|(\*.[a-z]{2})/g, ''), 
     isRecursive: normalize(file).includes(sep + '**'), 
     pattern:  basename(file), 
     relative 
  } 
  return options 
} 

async function walk(options: GlobFileOptions) { 
  const rootDir = resolve(), { dir, isRecursive, pattern } = options
  const folders = await promises.readdir(dir, { withFileTypes: true }) 
  const files = await Promise.all(folders.map(folder => { 
    const res = join(options.dir, folder.name) 
    if (folder.isDirectory() && isRecursive) { 
      return walk({ ...options, dir: res }) 
    } 
    if (folder.isFile() && minimatch(basename(res), pattern)) { 
      return (options.relative  ? `.${sep}${relative(rootDir, res)}` : join(rootDir, res)) 
    }
  }))
  return Array.prototype.concat(...files.filter((files:string[]) => files)) 
} 

export async function globFiles(src: string | string[], relative: boolean = false) {
  const files = Array.isArray(src) ? src : [ src ]
  const result = await Promise.all(files.map(file => {
    const options = createOptions(file, relative)
    return walk(options)
  }))
  // @ts-ignore
  return result.flat().filter(value => value)
}