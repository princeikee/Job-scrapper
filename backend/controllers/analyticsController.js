import { asyncHandler } from '../server/errors.js';
import {
  getDashboardOverview,
  getRemoteVsOnsiteStats,
  getSalaryDistribution,
  getTopLocations,
  getTopSkills,
} from '../analytics/analyticsService.js';

export const topSkills = asyncHandler(async (_req, res) => {
  const data = await getTopSkills(10);
  res.json({ data });
});

export const salaryDistribution = asyncHandler(async (_req, res) => {
  const data = await getSalaryDistribution();
  res.json({ data });
});

export const topLocations = asyncHandler(async (_req, res) => {
  const data = await getTopLocations(10);
  res.json({ data });
});

export const remoteVsOnsite = asyncHandler(async (_req, res) => {
  const data = await getRemoteVsOnsiteStats();
  res.json({ data });
});

export const dashboardOverview = asyncHandler(async (_req, res) => {
  const data = await getDashboardOverview();
  res.json({ data });
});
