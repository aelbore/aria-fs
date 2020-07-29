import { resolve } from 'path'
import { promises, existsSync } from 'fs'
import { clean } from './clean'

type SymlinkType = 'file' | 'dir' | 'junction'

async function symlink(src: string, dest: string, type?: SymlinkType) {
  const source = resolve(src), destination = resolve(dest)
  await unlink(destination)
  await promises.symlink(source, destination,
    (process.platform.includes('win32') && type.includes('dir')) ? 'junction': type) 
}

async function unlink(dest: string) {
  const destination = resolve(dest)
  if (existsSync(destination)) {
    const { lstat, unlink } = promises
    const stat = await lstat(destination)
    if (stat.isDirectory()) {
      await clean(destination)
    }
    if (stat.isFile() || stat.isSymbolicLink()) {
      await unlink(dest)
    }
  }
}

export const symlinkDir = (src: string, dest: string) => symlink(src, dest, 'dir')
export const symlinkFile = (src: string, dest: string) => symlink(src, dest, 'file')
export const unlinkFile = (dest: string) => unlink(dest)
export const unlinkDir = (dest: string) => unlink(dest)