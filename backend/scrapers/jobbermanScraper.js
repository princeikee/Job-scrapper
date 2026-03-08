import { chromium } from 'playwright';
import { config } from '../server/config.js';
import { logger } from '../server/logger.js';

const SOURCE_NAME = 'Jobberman';
const SOURCE_URL = 'https://www.jobberman.com/jobs';

function textOrNull(value) {
  if (!value) return null;
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

export async function scrapeJobbermanJobs() {
  const browser = await chromium.launch({
    headless: config.SCRAPER_HEADLESS,
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    await page.goto(SOURCE_URL, {
      timeout: config.SCRAPER_TIMEOUT_MS,
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(2000);

    const jobs = await page.$$eval('a[href*="/job"]', (anchors) => {
      return anchors
        .map((anchor) => {
          const card = anchor.closest('article, li, div');
          const title = anchor.textContent?.trim() || null;
          const href = anchor.getAttribute('href');

          const company =
            card?.querySelector('[data-testid*="company"], .company, [class*="company"]')
              ?.textContent
              ?.trim() || null;
          const location =
            card?.querySelector('[data-testid*="location"], .location, [class*="location"]')
              ?.textContent
              ?.trim() || 'Nigeria';

          if (!title || !href) return null;
          if (title.length < 4 || title.length > 180) return null;

          const jobUrl = href.startsWith('http') ? href : `https://www.jobberman.com${href}`;
          return {
            title,
            company,
            location,
            salary: null,
            skills: [],
            description: null,
            jobUrl,
            source: 'Jobberman',
          };
        })
        .filter(Boolean)
        .slice(0, 120);
    });

    const deduped = [];
    const seen = new Set();
    for (const job of jobs) {
      const title = textOrNull(job.title);
      const jobUrl = textOrNull(job.jobUrl);
      if (!title || !jobUrl) continue;
      if (seen.has(jobUrl)) continue;
      seen.add(jobUrl);
      deduped.push({
        ...job,
        title,
        company: textOrNull(job.company),
        location: textOrNull(job.location) || 'Nigeria',
      });
    }

    logger.info({ count: deduped.length, source: SOURCE_NAME }, 'Jobberman scrape completed');
    return deduped;
  } finally {
    await context.close();
    await browser.close();
  }
}

export const JOBBERMAN_SOURCE = {
  name: SOURCE_NAME,
  baseUrl: SOURCE_URL,
};

