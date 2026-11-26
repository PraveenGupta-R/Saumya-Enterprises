// Starts the API (Worker + local database, port 8787) and the Angular dev server together.
// The website's inquiry form needs BOTH running, otherwise sending an inquiry fails.
import { spawn } from 'node:child_process';

const procs = [
  spawn('npm', ['run', 'api'], { stdio: 'inherit', shell: true }),
  spawn('npm', ['start'], { stdio: 'inherit', shell: true }),
];
const stop = () => procs.forEach((p) => p.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', stop));
