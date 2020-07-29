import { join } from 'path'
import { promises, existsSync } from 'fs'

export async function clean(dir: string) {
  if (existsSync(dir)) {
    const { readdir, lstat, unlink, rmdir } = promises
    const files = await readdir(dir)
    await Promise.all(files.map(async file => {
      const p = join(dir, file)
      const stat = await lstat(p)
      if (stat.isDirectory()) {
        await clean(p)
      } else {
        await unlink(p)
      }
    }))
    await rmdir(dir)
  }
}