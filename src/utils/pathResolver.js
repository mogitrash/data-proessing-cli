import { resolve } from 'node:path';

let ctx = null;

export const setupPathResolver = (newCtx) => {
  ctx = newCtx;
};

export const resolvePath = (targetPath) => resolve(ctx.getWorkingDir(), targetPath);
