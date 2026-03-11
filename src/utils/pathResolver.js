import { resolve } from 'node:path';

export const resolvePath = (workingDir, targetPath) => resolve(workingDir, targetPath);
