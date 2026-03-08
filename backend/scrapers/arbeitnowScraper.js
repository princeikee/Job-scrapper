import { logger } from '../server/logger.js';

const SOURCE_NAME = 'Arbeitnow';
const SOURCE_URL = 'https://www.arbeitnow.com/jobs';
const SOURCE_API_URL = 'https://www.arbeitnow.com/api/job-board-api';

function textOrNull(value) {
  if (!value) return null;
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSkills(candidate) {
  if (!Array.isArray(candidate)) return [];
  return candidate
    .map((item) => textOrNull(item))
    .filter(Boolean);
}

function normalizeLocation(candidate) {
  const value = textOrNull(candidate);
  if (!value) return 'Remote';
  return value;
}

export async function scrapeArbeitnowJobs() {
  const jobs = [];
  let page = 1;
  const maxPages = 4;

  while (page <= maxPages) {
    const response = await fetch(`${SOURCE_API_URL}?page=${page}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'job-scraper/1.0 (+https://example.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Arbeitnow API request failed (${response.status})`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    if (rows.length === 0) break;

    for (const item of rows) {
      const mapped = {
        title: textOrNull(item?.title),
        company: textOrNull(item?.company_name),
        location: normalizeLocation(item?.location),
        salary: null,
        skills: normalizeSkills(item?.tags),
        description: textOrNull(item?.description),
        jobUrl: textOrNull(item?.url),
        source: SOURCE_NAME,
      };

      if (mapped.title && mapped.jobUrl) {
        jobs.push(mapped);
      }
    }

    page += 1;
  }

  logger.info({ count: jobs.length, source: SOURCE_NAME }, 'Arbeitnow scrape completed');
  return jobs;
}

export const ARBEITNOW_SOURCE = {
  name: SOURCE_NAME,
  baseUrl: SOURCE_URL,
};

