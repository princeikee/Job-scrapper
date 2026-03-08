import { config } from '../server/config.js';
import { logger } from '../server/logger.js';

const SOURCE_NAME = 'Adzuna Nigeria';
const SOURCE_URL = 'https://www.adzuna.com';
const BASE_API_URL = 'https://api.adzuna.com/v1/api/jobs/ng/search';

function textOrNull(value) {
  if (!value) return null;
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSalary(job) {
  const min = Number.isFinite(job?.salary_min) ? `$${Math.round(job.salary_min)}` : '';
  const max = Number.isFinite(job?.salary_max) ? `$${Math.round(job.salary_max)}` : '';
  if (!min && !max) return null;
  return min && max ? `${min} - ${max}` : min || max;
}

function mapAdzunaJob(job) {
  return {
    title: textOrNull(job?.title),
    company: textOrNull(job?.company?.display_name),
    location: textOrNull(job?.location?.display_name),
    salary: normalizeSalary(job),
    skills: [],
    description: textOrNull(job?.description),
    jobUrl: textOrNull(job?.redirect_url),
    source: SOURCE_NAME,
  };
}

export function canUseAdzunaNigeria() {
  return Boolean(config.ADZUNA_APP_ID && config.ADZUNA_APP_KEY);
}

export async function scrapeAdzunaNigeriaJobs() {
  if (!canUseAdzunaNigeria()) {
    throw new Error('Adzuna credentials missing. Set ADZUNA_APP_ID and ADZUNA_APP_KEY.');
  }

  const jobs = [];
  const maxPages = 3;

  for (let page = 1; page <= maxPages; page += 1) {
    const url =
      `${BASE_API_URL}/${page}` +
      `?app_id=${encodeURIComponent(config.ADZUNA_APP_ID)}` +
      `&app_key=${encodeURIComponent(config.ADZUNA_APP_KEY)}` +
      '&results_per_page=50' +
      '&what=software%20developer';

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Adzuna NG API request failed (${response.status})`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.results) ? payload.results : [];
    if (rows.length === 0) break;

    for (const row of rows) {
      const mapped = mapAdzunaJob(row);
      if (mapped.title && mapped.jobUrl) {
        jobs.push(mapped);
      }
    }
  }

  logger.info({ source: SOURCE_NAME, count: jobs.length }, 'Adzuna Nigeria scrape completed');
  return jobs;
}

export const ADZUNA_NG_SOURCE = {
  name: SOURCE_NAME,
  baseUrl: SOURCE_URL,
};

