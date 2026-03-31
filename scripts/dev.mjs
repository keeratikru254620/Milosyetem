import { spawn } from 'node:child_process';
import process from 'node:process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  {
    name: 'backend',
    command: npmCommand,
    args: ['--prefix', 'backend', 'run', 'dev'],
  },
  {
    name: 'frontend',
    command: npmCommand,
    args: ['run', 'dev:client'],
  },
];

const children = [];
let isShuttingDown = false;

const shutdown = (code = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(code), 250);
};

for (const processConfig of processes) {
  const child = spawn(processConfig.command, processConfig.args, {
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`[${processConfig.name}] exited with code ${code ?? 0}`);
      shutdown(code ?? 0);
    }
  });

  child.on('error', (error) => {
    console.error(`[${processConfig.name}] failed to start`, error);
    shutdown(1);
  });

  children.push(child);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
