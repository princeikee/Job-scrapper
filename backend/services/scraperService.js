import { scrapeRemoteOkJobs } from '../scrapers/remoteOkScraper.js';
import { scrapeRemotiveJobs } from '../scrapers/remotiveScraper.js';
import { scrapeArbeitnowJobs } from '../scrapers/arbeitnowScraper.js';
import { scrapeJobbermanJobs } from '../scrapers/jobbermanScraper.js';
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

  try {
    logger.info({ trigger }, 'Scraper started');
    const scraperRuns = [
      {
        name: 'RemoteOK',
        baseUrl: 'https://remoteok.com',
        scrape: scrapeRemoteOkJobs,
      },
      {
        name: 'Remotive',
        baseUrl: 'https://remotive.com',
        scrape: scrapeRemotiveJobs,
      },
      {
        name: 'Arbeitnow',
        baseUrl: 'https://www.arbeitnow.com',
        scrape: scrapeArbeitnowJobs,
      },
      {
        name: 'Jobberman',
        baseUrl: 'https://www.jobberman.com',
        scrape: scrapeJobbermanJobs,
      },
    ];

    const breakdown = [];
    let jobsFound = 0;
    let inserted = 0;
    let updated = 0;

    for (const scraperRun of scraperRuns) {
      const source = await getOrCreateSource({
        name: scraperRun.name,
        baseUrl: scraperRun.baseUrl,
      });

      const logRow = await startScrapeLog({ sourceId: source.id });

      try {
        const jobs = await scraperRun.scrape();
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

        jobsFound += jobs.length;
        inserted += upsertResult.inserted;
        updated += upsertResult.updated;

        breakdown.push({
          source: source.name,
          jobsFound: jobs.length,
          inserted: upsertResult.inserted,
          updated: upsertResult.updated,
          status: 'success',
        });
      } catch (error) {
        await finishScrapeLog({
          logId: logRow.id,
          status: 'failed',
          startedAt: logRow.started_at,
          message: error.message,
        });

        logger.warn({ err: error, source: scraperRun.name }, 'Source scrape failed');
        breakdown.push({
          source: scraperRun.name,
          jobsFound: 0,
          inserted: 0,
          updated: 0,
          status: 'failed',
          error: error.message,
        });
      }
    }

    if (breakdown.every((item) => item.status === 'failed')) {
      throw new AppError('All scraper sources failed', 502);
    }

    logger.info({ trigger, jobsFound, inserted, updated, breakdown }, 'Scraper finished successfully');

    return {
      trigger,
      jobsFound,
      inserted,
      updated,
      breakdown,
    };
  } catch (error) {
    logger.error({ err: error }, 'Scraper failed');
    throw error;
  } finally {
    scrapeRunning = false;
  }
}
