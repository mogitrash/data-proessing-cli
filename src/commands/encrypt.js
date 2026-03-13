import { createCipheriv, randomBytes, scrypt } from 'node:crypto';
import { ERRORS } from '../constants.js';
import { pipeline } from 'node:stream/promises';
import { appendFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { resolvePath } from '../utils/pathResolver.js';
import { parseNamedArgs } from '../utils/argParser.js';
import { createReadStream, createWriteStream } from 'node:fs';

const scryptAsync = promisify(scrypt);

export const encryptCommand = {
  encrypt: async (ctx, args) => {
    const { input, output, password } = parseNamedArgs(args);

    if (typeof input !== 'string' || typeof output !== 'string' || typeof password !== 'string') {
      throw new Error(ERRORS.INVALID_INPUT);
    }

    const inputPath = resolvePath(input);
    const outputPath = resolvePath(output);

    try {
      const algorithm = 'aes-256-gcm';
      const salt = randomBytes(16);
      const iv = randomBytes(12);
      const key = await scryptAsync(password, salt, 32);
      const cipher = createCipheriv(algorithm, key, iv);

      await writeFile(outputPath, Buffer.concat([salt, iv]));
      await pipeline(
        createReadStream(inputPath),
        cipher,
        createWriteStream(outputPath, { flags: 'a' }),
      );

      await appendFile(outputPath, cipher.getAuthTag());
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }
  },
};
