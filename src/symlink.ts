import { resolve } from 'path'
import { promises, existsSync } from 'fs'
import { clean } from './clean'

type SymlinkType = 'file' | 'dir' | 'junction'

async function symlink(src: string, dest: string, type?: SymlinkType) {
  const source = resolve(src), destination = resolve(dest)
  await unlink(destination)
  await promises.symlink(source, destination, 
    (process.platform === 'win32') ? 'junction': type) 
}

async function unlink(dest: string) {
  const destination = resolve(dest)
  if (existsSync(destination)) {
    const stat = await promises.lstat(destination)
    if (stat.isDirectory()) {
      await clean(destination)
    }
    if (stat.isFile() || stat.isSymbolicLink()) {
      await promises.unlink(dest)
    }
  }
}

export const symlinkDir = (src: string, dest: string) => symlink(src, dest, 'dir')
export const symlinkFile = (src: string, dest: string) => symlink(src, dest, 'file')
export const unlinkFile = (dest: string) => unlink(dest)
export const unlinkDir = (dest: string) => unlink(dest)