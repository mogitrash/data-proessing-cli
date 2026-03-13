import { readFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { resolvePath } from '../utils/pathResolver.js';
import { parseNamedArgs } from '../utils/argParser.js';
import { ERRORS } from '../constants.js';

export const jsonToCsvCommand = {
  'json-to-csv': async (ctx, args) => {
    const { input, output } = parseNamedArgs(args);

    if (typeof input !== 'string' || typeof output !== 'string') {
      throw new Error(ERRORS.INVALID_INPUT);
    }

    let arr;

    try {
      const json = await readFile(resolvePath(input), { encoding: 'utf-8' });
      arr = JSON.parse(json);
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }

    if (!Array.isArray(arr)) {
      throw new Error(ERRORS.OPERATION_FAILED);
    }

    const outputPath = resolvePath(output);
    const writeStream = createWriteStream(outputPath, { encoding: 'utf-8' });

    try {
      if (arr.length > 0) {
        const headers = Object.entries(arr[0])
          .map(([key]) => key)
          .join(',');

        if (!writeStream.write(`${headers}\n`)) {
          await new Promise((resolve) => writeStream.once('drain', resolve));
        }

        for (const value of arr) {
          const line = Object.entries(value)
            .map(([, v]) => v)
            .join(',');

          if (!writeStream.write(`${line}\n`)) {
            await new Promise((resolve) => writeStream.once('drain', resolve));
          }
        }
      }

      await new Promise((resolve, reject) => {
        writeStream.end((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }
  },
};
