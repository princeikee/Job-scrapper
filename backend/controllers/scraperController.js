import { asyncHandler } from '../server/errors.js';
import { runScraperNow } from '../services/scraperService.js';

export const runScraper = asyncHandler(async (_req, res) => {
  const result = await runScraperNow('api');
  res.status(202).json({
    message: 'Scraper run completed',
    data: result,
  });
});
