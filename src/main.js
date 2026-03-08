import * as readline from 'node:readline/promises';
import * as os from 'node:os';

const rl = readline.createInterface(process.stdin, process.stdout);
export let workingDir = os.homedir();

const setupReadline = () => {
  rl.write('Welcome to Data Processing CLI!\n');
  rl.write(`You are currently in ${workingDir}\n`);
  rl.prompt(true);

  rl.on('line', (input) => {
    // Handle commands here

    rl.prompt();
  });

  const exit = () => {
    rl.write('Thank you for using Data Processing CLI!\n');
    rl.close();
  };

  rl.on('SIGINT', exit);
};

setupReadline();
