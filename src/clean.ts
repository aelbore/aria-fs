import { join } from 'path'
import { promises, existsSync } from 'fs'

export async function clean(dir: string) {
  if (existsSync(dir)) {
    const files = await promises.readdir(dir)
    await Promise.all(files.map(async file => {
      const p = join(dir, file)
      const stat = await promises.lstat(p)
      if (stat.isDirectory()) {
        await clean(p)
      } else {
        await promises.unlink(p)
      }
    }))
    await promises.rmdir(dir)
  }
}