import { z } from 'zod';
import { asyncHandler, AppError } from '../server/errors.js';
import { getJobs, getRecentJobs, resetJobsData, searchJobs } from '../services/jobService.js';

const jobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  source: z.string().optional(),
  location: z.string().optional(),
  remote: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value === 'true') return true;
      if (value === 'false') return false;
      throw new Error('remote must be true or false');
    }),
});

export const listJobs = asyncHandler(async (req, res) => {
  const parsed = jobsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError('Invalid query params', 400, parsed.error.flatten());
  }

  const jobs = await getJobs(parsed.data);
  res.json({ data: jobs });
});

export const listRecentJobs = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit ?? 20);
  const jobs = await getRecentJobs(limit);
  res.json({ data: jobs });
});

export const searchJobsController = asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) {
    throw new AppError('q query parameter is required', 400);
  }
  const limit = Number(req.query.limit ?? 20);
  const jobs = await searchJobs(q, limit);
  res.json({ data: jobs });
});

export const resetJobsController = asyncHandler(async (_req, res) => {
  const result = await resetJobsData();
  res.json({
    message: 'Jobs table cleared',
    data: result,
  });
});
