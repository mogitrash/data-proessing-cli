import * as os from 'node:os';
import { setupRepl } from './repl.js';
import { setupPathResolver } from './utils/pathResolver.js';

let workingDir = os.homedir();

setupPathResolver({
  getWorkingDir: () => workingDir,
});
setupRepl({
  getWorkingDir: () => workingDir,
  setWorkingDir: (value) => (workingDir = value),
});
