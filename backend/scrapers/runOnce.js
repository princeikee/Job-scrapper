import { runScraperNow } from '../services/scraperService.js';
import { logger } from '../server/logger.js';
import { pool } from '../db/pool.js';

runScraperNow('cli')
  .then(async (result) => {
    logger.info(result, 'One-time scrape done');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error({ err: error }, 'One-time scrape failed');
    await pool.end();
    process.exit(1);
  });
