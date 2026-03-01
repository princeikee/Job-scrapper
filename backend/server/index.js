import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { pool } from '../db/pool.js';
import { startScheduler, stopScheduler } from '../scheduler/scrapeScheduler.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'Backend server started');
  startScheduler();
});

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down backend');
  stopScheduler();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
