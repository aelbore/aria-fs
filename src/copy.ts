import { resolve, sep, dirname } from 'path'
import { promises } from 'fs'
import { globFiles } from './glob'

export async function copyFiles(src: string | string[], destRootDir: string) {
  const files = await globFiles(src)
  await Promise.all(files.map(async file => {
    const srcRootDir = file.replace(resolve() + sep, '').split(sep)[0]
    const destPath = file.replace(srcRootDir, destRootDir)
    await promises.mkdir(dirname(destPath), { recursive: true })
    await promises.copyFile(file, destPath)
  }))
}