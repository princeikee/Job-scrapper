import cron from 'node-cron';
import { logger } from '../server/logger.js';
import { runScraperNow } from '../services/scraperService.js';

let scheduledTask = null;
const CRON_EXPRESSION = '0 */6 * * *';

export function startScheduler() {
  if (scheduledTask) return;

  scheduledTask = cron.schedule(CRON_EXPRESSION, async () => {
    try {
      await runScraperNow('scheduler');
    } catch (error) {
      logger.error({ err: error }, 'Scheduled scraper run failed');
    }
  });

  logger.info({ cron: CRON_EXPRESSION }, 'Scraper scheduler started');
}

export function stopScheduler() {
  if (!scheduledTask) return;
  scheduledTask.stop();
  scheduledTask = null;
}

export function getSchedulerInfo() {
  return {
    cron: CRON_EXPRESSION,
    active: Boolean(scheduledTask),
  };
}
