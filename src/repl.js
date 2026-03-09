import * as readline from 'node:readline/promises';
import { ERRORS } from './constants.js';

const coreCommands = {
  '.exit': (args, ctx) => {
    ctx.exit();
  },
};

const commands = {
  up: async () => {},
  cd: () => {
    throw new Error();
  },
};

export const setupRepl = (ctx) => {
  const rl = readline.createInterface(process.stdin, process.stdout);
  const getWorkingDir = ctx.getWorkingDir;

  const exit = () => {
    process.stdout.write('Thank you for using Data Processing CLI!\n');
    rl.close();
    process.exit(0);
  };

  const replCxt = { exit, ...ctx };

  process.stdout.write('Welcome to Data Processing CLI!\n');
  process.stdout.write(`You are currently in ${getWorkingDir()}\n`);
  rl.prompt(true);

  const handleCommands = (input, ctx, ...configs) => {
    const merged = Object.assign({}, ...configs);

    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    const [name, ...args] = trimmed.split(/\s+/);
    const fn = merged[name];

    if (fn) {
      return fn(args, ctx);
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

  rl.on('line', (input) => {
    try {
      handleCommands(input, replCxt, commands, coreCommands);
      process.stdout.write(`You are currently in ${getWorkingDir()}\n`);
    } catch (error) {
      handleError(error);
    }

    rl.prompt();
  });

  rl.on('SIGINT', exit);
};
