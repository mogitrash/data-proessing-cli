import * as readline from 'node:readline/promises';
import { navigationCommands } from './commands/navigation.js';
import { ERRORS } from './constants.js';
import { parseArgs } from './utils/argParser.js';
import { countCommand } from './commands/count.js';
import { hashCommands } from './commands/hash.js';
import { csvToJsonCommand } from './commands/csvToJson.js';
import { jsonToCsvCommand } from './commands/jsonToCsv.js';
import { hashCompareCommand } from './commands/hashCompare.js';
import { encryptCommand } from './commands/encrypt.js';
import { decryptCommand } from './commands/decrypt.js';
import { logStatsCommand } from './commands/log-stats.js';

const coreCommands = {
  '.exit': (ctx) => {
    ctx.exit();
  },
};

export const setupRepl = (ctx) => {
  const rl = readline.createInterface(process.stdin, process.stdout);

  const exit = () => {
    process.stdout.write('Thank you for using Data Processing CLI!\n');
    rl.close();
    process.exit(0);
  };

  const replCxt = { exit, ...ctx };

  process.stdout.write('Welcome to Data Processing CLI!\n');
  process.stdout.write(`You are currently in ${ctx.getWorkingDir()}\n`);
  rl.prompt(true);

  const handleCommands = (input, ctx, ...configs) => {
    const merged = Object.assign({}, ...configs);

    const { name, args } = parseArgs(input);

    if (!name) return;

    const fn = merged[name];

    if (fn) {
      return fn(ctx, args);
    } else {
      throw new Error(ERRORS.INVALID_INPUT);
    }
  };

  const handleError = (error) => {
    if (error.message) {
      process.stdout.write(`${error.message}\n`);
    } else {
      process.stdout.write(`${ERRORS.OPERATION_FAILED}\n`);
    }
  };

  rl.on('line', async (input) => {
    try {
      await handleCommands(
        input,
        replCxt,
        coreCommands,
        navigationCommands,
        countCommand,
        hashCommands,
        csvToJsonCommand,
        jsonToCsvCommand,
        hashCompareCommand,
        encryptCommand,
        decryptCommand,
        logStatsCommand,
      );
      process.stdout.write(`You are currently in ${ctx.getWorkingDir()}\n`);
    } catch (error) {
      handleError(error);
    }

    rl.prompt();
  });

  rl.on('SIGINT', exit);
};
