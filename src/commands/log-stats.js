import { resolvePath } from '../utils/pathResolver.js';
import { parseNamedArgs } from '../utils/argParser.js';
import { ERRORS } from '../constants.js';
import { open, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { Worker } from 'node:worker_threads';

const findAlignedBoundary = async (fd, rawBoundary, fileSize) => {
  const buf = Buffer.alloc(64 * 1024);
  let position = rawBoundary;

  while (position < fileSize) {
    const { bytesRead } = await fd.read(buf, 0, buf.length, position);

    if (bytesRead === 0) {
      return fileSize;
    }

    const newlineIndex = buf.subarray(0, bytesRead).indexOf(10);

    if (newlineIndex !== -1) {
      return position + newlineIndex + 1;
    }

    position += bytesRead;
  }

  return fileSize;
};

const runWorker = (workerData) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/logWorker.js', import.meta.url), {
      workerData,
    });

    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });

export const logStatsCommand = {
  'log-stats': async (ctx, args) => {
    const { input, output } = parseNamedArgs(args);

    if (typeof input !== 'string' || typeof output !== 'string') {
      throw new Error(ERRORS.INVALID_INPUT);
    }

    const inputPath = resolvePath(input);
    const outputPath = resolvePath(output);

    let fd;

    try {
      fd = await open(inputPath);
      const size = (await fd.stat()).size;
      const workerCount = Math.max(1, cpus().length);
      const step = Math.ceil(size / workerCount);
      const boundaries = [0];

      for (let index = 1; index < workerCount; index++) {
        const rawBoundary = Math.min(index * step, size);
        const alignedBoundary = await findAlignedBoundary(fd, rawBoundary, size);
        boundaries.push(alignedBoundary);
      }

      boundaries.push(size);

      const chunks = boundaries.slice(0, -1).map((start, index) => ({
        inputPath,
        start,
        end: boundaries[index + 1],
      }));

      const partials = await Promise.all(chunks.map((chunk) => runWorker(chunk)));

      const result = {
        total: 0,
        levels: {},
        status: {},
        topPaths: [],
        avgResponseTimeMs: 0,
      };
      let responseTimeSum = 0;
      const pathCounts = {};

      for (const partial of partials) {
        result.total += partial.total;
        responseTimeSum += partial.responseTimeSum;

        for (const [level, count] of Object.entries(partial.levels)) {
          result.levels[level] = (result.levels[level] ?? 0) + count;
        }

        for (const [statusKey, count] of Object.entries(partial.status)) {
          result.status[statusKey] = (result.status[statusKey] ?? 0) + count;
        }

        for (const [path, count] of Object.entries(partial.pathCounts)) {
          pathCounts[path] = (pathCounts[path] ?? 0) + count;
        }
      }

      result.avgResponseTimeMs =
        result.total > 0 ? Number((responseTimeSum / result.total).toFixed(2)) : 0;

      result.topPaths = Object.entries(pathCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([path, count]) => ({ path, count }));

      await writeFile(outputPath, JSON.stringify(result, null, 2));
    } catch {
      throw new Error(ERRORS.OPERATION_FAILED);
    } finally {
      await fd?.close();
    }
  },
};
