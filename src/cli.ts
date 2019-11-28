
import { symlinkDir, unlinkDir, mkdirp, clean } from './file'


export async function run(version: string) { 
  const program = require('sade')('aria-fs')

  program
    .version(version)
    .option('-t, --type', 'Type of symlink (file, directory)', 'dir')
    .command('link <src> <dest>')
    .example('aria-fs link src-folder dest-folder --type dir')
    .action(linkHandler)

  program.command('unlink <path>')
    .example('aria-fs unlink path-of-folder-or-file')
    .action(unlinkHandler)

  program.command('mkdirp <dir>')
    .example('aria-fs mkdirp new-folder')
    .action(mkdripHandler)

  program.command('clean <dir>')
    .example('aria-fs clean dist')
    .action(cleanHandler)

  program.parse(process.argv)

  async function linkHandler(src: string, dest: string, opts: any) {
    await symlinkDir(src, dest)
  }

  async function unlinkHandler(path: string, opts: any) {
    await unlinkDir(path)
  }

  async function mkdripHandler(dir: string, opts: any) {
    mkdirp(dir)
  }
  
  async function cleanHandler(dir: string, opts: any) {
    await clean(dir)
  }

}