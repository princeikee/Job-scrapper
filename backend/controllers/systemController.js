import { asyncHandler } from '../server/errors.js';
import { pool } from '../db/pool.js';
import { getLatestScrapeLog } from '../services/scrapeLogService.js';
import { getSchedulerInfo } from '../scheduler/scrapeScheduler.js';
import { getScraperRuntimeState } from '../services/scraperService.js';

export const systemStatus = asyncHandler(async (_req, res) => {
  const dbCheck = await pool.query('SELECT NOW()');
  const latestLog = await getLatestScrapeLog();

  res.json({
    data: {
      database: {
        healthy: dbCheck.rowCount === 1,
      },
      scheduler: getSchedulerInfo(),
      scraper: getScraperRuntimeState(),
      lastScrape: latestLog,
    },
  });
});
