import { opendir, readdir } from 'node:fs/promises';
import { ERRORS } from '../constants.js';
import { resolvePath } from '../utils/pathResolver.js';

export const navigationCommands = {
  up: (ctx) => {
    ctx.setWorkingDir(resolvePath('../'));
  },
  cd: async (ctx, [path]) => {
    try {
      const newPath = resolvePath(path);
      await opendir(newPath);
      ctx.setWorkingDir(newPath);
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }
  },
  ls: async (ctx) => {
    const dirents = await readdir(ctx.getWorkingDir(), { withFileTypes: true });

    const folders = dirents.filter((dirent) => dirent.isDirectory());
    const files = dirents.filter((dirent) => dirent.isFile());

    const compareFn = (a, b) => a.name.localeCompare(b.name);

    folders.sort(compareFn);
    files.sort(compareFn);

    for (const folder of folders) {
      process.stdout.write(`${folder.name} [folder]\n`);
    }

    for (const file of files) {
      process.stdout.write(`${file.name} [file]\n`);
    }
  },
};
