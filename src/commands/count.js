import { createReadStream } from 'node:fs';
import { resolvePath } from '../utils/pathResolver.js';
import { ERRORS } from '../constants.js';
import { parseNamedArgs } from '../utils/argParser.js';

export const countCommand = {
  count: async (ctx, args) => {
    const parsedArgs = parseNamedArgs(args);
    const input = parsedArgs.input;

    if (typeof input !== 'string') {
      throw new Error(ERRORS.INVALID_INPUT);
    }

    try {
      const path = resolvePath(input);
      const readStream = createReadStream(path, 'utf-8');

      let linesCount = 0;
      let wordCount = 0;
      let characters = 0;

      for await (const chunk of readStream) {
        characters += chunk.length;
        linesCount += chunk.split('\n').length - 1;
        wordCount += chunk.split(/\s+/).filter(Boolean).length;
      }

      if (characters > 0) {
        linesCount++;
      }

      process.stdout.write(`Lines: ${linesCount}\n`);
      process.stdout.write(`Words: ${wordCount}\n`);
      process.stdout.write(`Characters: ${characters}\n`);
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }
  },
};
