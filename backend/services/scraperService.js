import { scrapeRemoteOkJobs } from '../scrapers/remoteOkScraper.js';
import { logger } from '../server/logger.js';
import { getOrCreateSource } from './sourceService.js';
import { upsertJobsFromSource } from './jobService.js';
import { finishScrapeLog, startScrapeLog } from './scrapeLogService.js';
import { AppError } from '../server/errors.js';

let scrapeRunning = false;
let lastRunAt = null;

export function getScraperRuntimeState() {
  return {
    scrapeRunning,
    lastRunAt,
  };
}

export async function runScraperNow(trigger = 'manual') {
  if (scrapeRunning) {
    throw new AppError('Scraper already running', 409);
  }

  scrapeRunning = true;
  lastRunAt = new Date().toISOString();

  const source = await getOrCreateSource({
    name: 'RemoteOK',
    baseUrl: 'https://remoteok.com',
  });

  const logRow = await startScrapeLog({ sourceId: source.id });

  try {
    logger.info({ trigger }, 'Scraper started');
    const jobs = await scrapeRemoteOkJobs();
    const upsertResult = await upsertJobsFromSource(source.id, jobs);

    await finishScrapeLog({
      logId: logRow.id,
      status: 'success',
      jobsFound: jobs.length,
      jobsInserted: upsertResult.inserted,
      jobsUpdated: upsertResult.updated,
      startedAt: logRow.started_at,
      message: `Scrape completed via ${trigger}`,
    });

    logger.info(
      { trigger, ...upsertResult, jobsFound: jobs.length },
      'Scraper finished successfully'
    );

    return {
      source: source.name,
      trigger,
      jobsFound: jobs.length,
      ...upsertResult,
    };
  } catch (error) {
    await finishScrapeLog({
      logId: logRow.id,
      status: 'failed',
      startedAt: logRow.started_at,
      message: error.message,
    });
    logger.error({ err: error }, 'Scraper failed');
    throw error;
  } finally {
    scrapeRunning = false;
  }
}
