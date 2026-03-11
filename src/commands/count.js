import { createReadStream } from 'node:fs';
import { resolvePath } from '../utils/pathResolver.js';
import { ERRORS } from '../constants.js';

export const countCommands = {
  count: (ctx, [input]) =>
    new Promise((resolve, reject) => {
      let readStream;

      try {
        const path = resolvePath(ctx.getWorkingDir(), input);
        readStream = createReadStream(path, 'utf-8');
      } catch {
        reject(new Error(ERRORS.OPERATION_FAILED));
      }

      let linesCount = 0;
      let wordCount = 0;
      let characters = 0;

      readStream.on('data', (chunk) => {
        characters += chunk.length;
        linesCount += chunk.split('').filter((value) => value === '\n').length;
        wordCount += chunk.split(/\s+/).filter(Boolean).length;
      });

      readStream.on('end', () => {
        if (characters > 0) {
          linesCount++;
        }

        process.stdout.write(`Lines: ${linesCount}\n`);
        process.stdout.write(`Words: ${wordCount}\n`);
        process.stdout.write(`Characters: ${characters}\n`);
        resolve();
      });

      readStream.on('error', (err) => {
        reject(new Error(ERRORS.OPERATION_FAILED));
      });
    }),
};
