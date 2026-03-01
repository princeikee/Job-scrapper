import { chromium } from 'playwright';
import { config } from '../server/config.js';
import { logger } from '../server/logger.js';

const SOURCE_NAME = 'RemoteOK';
const SOURCE_URL = 'https://remoteok.com/remote-dev-jobs';
const SOURCE_API_URL = 'https://remoteok.com/api';

function textOrNull(value) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSalaryFromApi(item) {
  if (item?.salary_min || item?.salary_max) {
    const min = item.salary_min ? `$${item.salary_min}` : '';
    const max = item.salary_max ? `$${item.salary_max}` : '';
    return textOrNull(`${min}${min && max ? ' - ' : ''}${max}`);
  }
  return textOrNull(item?.salary);
}

async function scrapeRemoteOkViaPlaywright() {
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

async function scrapeRemoteOkViaApi() {
  const response = await fetch(SOURCE_API_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`RemoteOK API request failed (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) return [];

  // First row can be metadata; keep only job-like rows with a URL and position/title.
  return payload
    .filter((item) => (item?.url || item?.id) && (item?.position || item?.title))
    .slice(0, 120)
    .map((item) => {
      const url = item.url?.startsWith('http') ? item.url : `https://remoteok.com${item.url || ''}`;
      return {
        title: textOrNull(item.position || item.title),
        company: textOrNull(item.company),
        location: textOrNull(item.location || 'Remote'),
        salary: normalizeSalaryFromApi(item),
        skills: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
        description: textOrNull(item.description),
        jobUrl: url,
        source: SOURCE_NAME,
      };
    })
    .filter((job) => job.title && job.jobUrl);
}

// Playwright is primary; API fallback keeps production scraping resilient
// in environments where anti-bot pages change DOM rendering.
export async function scrapeRemoteOkJobs() {
  try {
    const jobs = await scrapeRemoteOkViaPlaywright();
    if (jobs.length > 0) {
      return jobs;
    }
    logger.warn('RemoteOK Playwright scrape returned 0 jobs; trying API fallback');
  } catch (error) {
    logger.warn({ err: error }, 'RemoteOK Playwright scrape failed; trying API fallback');
  }

  const fallbackJobs = await scrapeRemoteOkViaApi();
  logger.info({ count: fallbackJobs.length }, 'RemoteOK API fallback completed');
  return fallbackJobs;
}

export const REMOTE_OK_SOURCE = {
  name: SOURCE_NAME,
  baseUrl: SOURCE_URL,
};
