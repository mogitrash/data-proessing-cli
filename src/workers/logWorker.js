import { workerData, parentPort } from 'node:worker_threads';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { ERRORS } from '../constants.js';

const getPartialStats = async ({ inputPath, start, end }) => {
  const result = {
    total: 0,
    levels: {},
    status: {},
    pathCounts: {},
    responseTimeSum: 0,
  };

  if (end <= start) {
    return result;
  }

  const rl = createInterface(
    createReadStream(inputPath, {
      start,
      end: end - 1,
      encoding: 'utf-8',
    }),
  );

  for await (const row of rl) {
    if (!row) {
      continue;
    }

    const [, level, , statusCode, responseTime, , path] = row.split(' ');

    if (!level || !statusCode || !responseTime || !path) {
      continue;
    }

    const statusKey = `${statusCode[0]}xx`;

    result.levels[level] = (result.levels[level] ?? 0) + 1;
    result.status[statusKey] = (result.status[statusKey] ?? 0) + 1;
    result.pathCounts[path] = (result.pathCounts[path] ?? 0) + 1;
    result.responseTimeSum += Number(responseTime);
    result.total++;
  }

  return result;
};

try {
  const partialStats = await getPartialStats(workerData);
  parentPort.postMessage(partialStats);
} catch (error) {
  if (error instanceof Error) {
    throw error;
  }

  throw new Error(ERRORS.OPERATION_FAILED);
}
