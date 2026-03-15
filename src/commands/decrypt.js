import { createReadStream, createWriteStream } from 'node:fs';
import { resolvePath } from '../utils/pathResolver.js';
import { ERRORS } from '../constants.js';
import { Transform } from 'node:stream';
import { promisify } from 'node:util';
import { scrypt, createDecipheriv } from 'node:crypto';
import { parseNamedArgs } from '../utils/argParser.js';
import { pipeline } from 'node:stream/promises';

const scryptAsync = promisify(scrypt);

export const decryptCommand = {
  decrypt: async (ctx, args) => {
    const { input, output, password } = parseNamedArgs(args);

    if (typeof input !== 'string' || typeof output !== 'string' || typeof password !== 'string') {
      throw new Error(ERRORS.INVALID_INPUT);
    }

    const inputPath = resolvePath(input);
    const outputPath = resolvePath(output);

    try {
      const algorithm = 'aes-256-gcm';

      class ParseTransform extends Transform {
        constructor(options) {
          super(options);

          this.isHeaderRead = false;
          this.buffer = Buffer.alloc(0);
          this.key = null;
          this.iv = null;
          this.salt = null;
          this.decipher = null;
        }

        _transform(chunk, encoding, cb) {
          (async () => {
            this.buffer = Buffer.concat([this.buffer, chunk]);

            if (!this.isHeaderRead) {
              if (this.buffer.length < 28) {
                return;
              }

              this.salt = Buffer.from(this.buffer.subarray(0, 16));
              this.iv = Buffer.from(this.buffer.subarray(16, 28));
              this.isHeaderRead = true;
              this.buffer = this.buffer.subarray(28);

              this.key = await scryptAsync(password, this.salt, 32);
              this.decipher = createDecipheriv(algorithm, this.key, this.iv);
            }

            if (this.buffer.length <= 16) {
              return;
            }

            const cipherText = this.buffer.subarray(0, this.buffer.length - 16);
            this.buffer = this.buffer.subarray(this.buffer.length - 16);

            const decrypted = this.decipher.update(cipherText);

            if (decrypted.length > 0) {
              this.push(decrypted);
            }
          })()
            .then(() => cb())
            .catch(() => {
              cb(new Error(ERRORS.OPERATION_FAILED));
            });
        }

        _flush(cb) {
          try {
            if (!this.isHeaderRead || !this.decipher || this.buffer.length !== 16) {
              cb(new Error(ERRORS.OPERATION_FAILED));
              return;
            }

            this.decipher.setAuthTag(this.buffer);
            const decrypted = this.decipher.final();

            if (decrypted.length > 0) {
              this.push(decrypted);
            }

            cb();
          } catch {
            cb(new Error(ERRORS.OPERATION_FAILED));
          }
        }
      }

      await pipeline(
        createReadStream(inputPath),
        new ParseTransform(),
        createWriteStream(outputPath),
      );
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }
  },
};
