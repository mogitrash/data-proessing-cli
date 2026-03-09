import * as os from 'node:os';
import { setupRepl } from './repl.js';

let workingDir = os.homedir();

setupRepl({
  getWorkingDir: () => workingDir,
  setWorkingDir: (value) => (workingDir = value),
});
