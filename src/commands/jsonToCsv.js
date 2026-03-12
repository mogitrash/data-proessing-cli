import { readFile } from 'node:fs/promises';
import { resolvePath } from '../utils/pathResolver.js';
import { parseNamedArgs } from '../utils/argParser.js';
import { ERRORS } from '../constants.js';
import { writeFile } from 'node:fs/promises';

export const jsonToCsvCommand = {
  jsonToCsv: async (ctx, args) => {
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

    let res = '';

    if (arr.length > 0) {
      const headers = Object.entries(arr[0])
        .map(([key, _]) => key)
        .join(',');
      res += `${headers}\n`;

      arr.forEach((value) => {
        const line = Object.entries(value)
          .map(([_, value]) => value)
          .join(',');
        res += `${line}\n`;
      });
    }

    try {
      await writeFile(resolvePath(output), res);
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }
  },
};
