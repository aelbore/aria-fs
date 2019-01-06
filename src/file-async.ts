import * as util from 'util';
import * as fs from 'fs';

const readdirAsync = util.promisify(fs.readdir);
const rmdirAsync = util.promisify(fs.rmdir);
const statAsync = util.promisify(fs.stat);
const lstatAsync = util.promisify(fs.lstat);
const unlinkAsync = util.promisify(fs.unlink);

export {
  readdirAsync,
  rmdirAsync,
  statAsync,
  lstatAsync,
  unlinkAsync
}