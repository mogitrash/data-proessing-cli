import { parseNamedArgs } from '../utils/argParser.js';
import { ERRORS } from '../constants.js';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolvePath } from '../utils/pathResolver.js';

const SUPPORTED_ALGORITHMS = ['sha256', 'md5', 'sha512'];

export const hashCommands = {
  hash: async (ctx, args) => {
    let { input, algorithm = 'sha256', save } = parseNamedArgs(args);

    if (typeof input !== 'string') {
      throw new Error(ERRORS.INVALID_INPUT);
    }

    if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
      throw new Error(ERRORS.OPERATION_FAILED);
    }

    const hash = createHash(algorithm);

    try {
      const readStream = createReadStream(resolvePath(input));

      for await (const chunk of readStream) {
        hash.update(chunk);
      }
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }

    const hashDigest = hash.digest('hex');

    if (save) {
      try {
        await writeFile(resolvePath(`${input}.${algorithm}`), hashDigest);
      } catch {
        throw new Error(ERRORS.OPERATION_FAILED);
      }
    }

    process.stdout.write(`${algorithm}: ${hashDigest}\n`);
  },
};
