import { ERRORS } from '../constants.js';
import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';
import { parseNamedArgs } from '../utils/argParser.js';

export const csvToJsonCommands = {
  csvToJson: async (ctx, args) => {
    const { input, output } = parseNamedArgs(args);

    if (typeof input !== 'string' || typeof output !== 'string') {
      throw new Error(ERRORS.INVALID_INPUT);
    }

    const readStream = createReadStream(resolvePath(input), { encoding: 'utf-8' });
    const result = [];
    let isFirstLineRead = false;
    let fields = [];
    let buf = '';

    const processLine = (rawLine) => {
      const line = rawLine.replace(/\r$/, '');

      if (!line) {
        return null;
      }

      if (!isFirstLineRead) {
        fields = line.split(',');
        isFirstLineRead = true;
        return null;
      }

      const data = line.split(',');
      const obj = {};

      fields.forEach((key, index) => {
        obj[key] = data[index];
      });

      return obj;
    };

    const csvToObjectTransform = new Transform({
      readableObjectMode: true,
      transform(chunk, _encoding, callback) {
        buf += chunk.toString();

        while (buf.includes('\n')) {
          const newlineIndex = buf.indexOf('\n');
          const line = buf.slice(0, newlineIndex);
          buf = buf.slice(newlineIndex + 1);

          const obj = processLine(line);

          if (obj) {
            this.push(obj);
          }
        }

        callback();
      },
      flush(callback) {
        if (buf.length > 0) {
          const obj = processLine(buf);

          if (obj) {
            this.push(obj);
          }
        }

        callback();
      },
    });

    const collectWritable = new Writable({
      objectMode: true,
      write(row, _encoding, callback) {
        result.push(row);
        callback();
      },
    });

    try {
      await pipeline(readStream, csvToObjectTransform, collectWritable);
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }

    const json = JSON.stringify(result, null, 2);

    try {
      await writeFile(resolvePath(output), json);
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    }
  },
};
