import { logger } from '../server/logger.js';

const SOURCE_NAME = 'Remotive';
const SOURCE_URL = 'https://remotive.com/remote-jobs/software-dev';
const SOURCE_API_URL = 'https://remotive.com/api/remote-jobs?category=software-dev';

function textOrNull(value) {
  if (!value) return null;
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSalary(value) {
  return textOrNull(value);
}

function normalizeLocation(candidate) {
  const value = textOrNull(candidate);
  if (!value) return 'Remote';
  return value;
}

function normalizeSkills(candidate) {
  if (!Array.isArray(candidate)) return [];
  return candidate
    .map((item) => textOrNull(item))
    .filter(Boolean);
}

export async function scrapeRemotiveJobs() {
  const response = await fetch(SOURCE_API_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'job-scraper/1.0 (+https://example.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`Remotive API request failed (${response.status})`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload?.jobs) ? payload.jobs : [];

  const jobs = rows
    .slice(0, 200)
    .map((item) => ({
      title: textOrNull(item?.title),
      company: textOrNull(item?.company_name),
      location: normalizeLocation(item?.candidate_required_location),
      salary: normalizeSalary(item?.salary),
      skills: normalizeSkills(item?.tags),
      description: textOrNull(item?.description),
      jobUrl: textOrNull(item?.url),
      source: SOURCE_NAME,
    }))
    .filter((job) => job.title && job.jobUrl);

  logger.info({ count: jobs.length, source: SOURCE_NAME }, 'Remotive scrape completed');
  return jobs;
}

export const REMOTIVE_SOURCE = {
  name: SOURCE_NAME,
  baseUrl: SOURCE_URL,
};

