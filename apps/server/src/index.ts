import 'dotenv/config';
import { buildApp } from './app.js';
import { config } from './config.js';

const app = buildApp();

app.listen({ port: config.port, host: '0.0.0.0' })
  .then((address) => {
    console.log(`xiangqi-web server listening on ${address}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
