import { chromium } from 'playwright';
import { config } from '../server/config.js';
import { logger } from '../server/logger.js';

const SOURCE_NAME = 'RemoteOK';
const SOURCE_URL = 'https://remoteok.com/remote-dev-jobs';

function textOrNull(value) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

// We intentionally keep selector strategy resilient to minor DOM changes.
export async function scrapeRemoteOkJobs() {
  const browser = await chromium.launch({
    headless: config.SCRAPER_HEADLESS,
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  const jobs = [];

  try {
    await page.goto(SOURCE_URL, {
      timeout: config.SCRAPER_TIMEOUT_MS,
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(1500);

    const listings = await page.$$(
      'tr.job, tr[data-id], tbody tr'
    );

    for (const listing of listings.slice(0, 80)) {
      const title = textOrNull(
        await listing.$eval('h2', (el) => el.textContent).catch(() => null)
      );
      const company = textOrNull(
        await listing.$eval('h3', (el) => el.textContent).catch(() => null)
      );

      const location = textOrNull(
        await listing
          .$eval('.location, .company_and_position [title*="location"]', (el) => el.textContent)
          .catch(() => 'Remote')
      );

      const salary = textOrNull(
        await listing.$eval('.salary, .location+div', (el) => el.textContent).catch(() => null)
      );

      const href = await listing
        .$eval('a.preventLink, a[itemprop="url"], a', (el) => el.getAttribute('href'))
        .catch(() => null);

      if (!title || !href) continue;

      const jobUrl = href.startsWith('http') ? href : `https://remoteok.com${href}`;
      const skillTags = await listing
        .$$eval('.tags .tag, .tag', (els) => els.map((el) => el.textContent || '').filter(Boolean))
        .catch(() => []);

      jobs.push({
        title,
        company,
        location,
        salary,
        skills: skillTags,
        description: null,
        jobUrl,
        source: SOURCE_NAME,
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'RemoteOK scrape failed');
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  return jobs;
}

export const REMOTE_OK_SOURCE = {
  name: SOURCE_NAME,
  baseUrl: SOURCE_URL,
};
