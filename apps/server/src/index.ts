import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { config } from './config.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRootEnvPath = path.resolve(currentDir, '../../../.env');
dotenv.config({ path: workspaceRootEnvPath, override: false, quiet: true });

const app = buildApp();

app.listen({ port: config.port, host: '0.0.0.0' })
  .then((address) => {
    console.log(`xiangqi-web server listening on ${address}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
