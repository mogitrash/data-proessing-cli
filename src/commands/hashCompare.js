import { parseNamedArgs } from '../utils/argParser.js';
import { ERRORS } from '../constants.js';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolvePath } from '../utils/pathResolver.js';

const SUPPORTED_ALGORITHMS = ['sha256', 'md5', 'sha512'];

export const hashCompareCommand = {
  'hash-compare': async (ctx, args) => {
    let { input, algorithm = 'sha256', hash } = parseNamedArgs(args);

    if (typeof input !== 'string' || typeof hash !== 'string') {
      throw new Error(ERRORS.INVALID_INPUT);
    }

    if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
      throw new Error(ERRORS.OPERATION_FAILED);
    }

    const hashObj = createHash(algorithm);

    try {
      const readStream = createReadStream(resolvePath(input));

      for await (const chunk of readStream) {
        hashObj.update(chunk);
      }
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }

    const hashDigest = hashObj.digest('hex');
    let hashFile;

    try {
      hashFile = await readFile(resolvePath(hash), { encoding: 'utf-8' });
      hashFile = hashFile.trim();
      hashFile = hashFile.toLowerCase();
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }

    process.stdout.write(hashDigest === hashFile ? 'OK\n' : 'MISMATCH\n');
  },
};
