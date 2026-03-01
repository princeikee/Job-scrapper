import { Router } from 'express';
import { analyticsRouter } from './analyticsRoutes.js';
import { jobsRouter } from './jobsRoutes.js';
import { scraperRouter } from './scraperRoutes.js';
import { systemRouter } from './systemRoutes.js';

export const apiRouter = Router();

apiRouter.use('/jobs', jobsRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/system', systemRouter);
apiRouter.use('/scraper', scraperRouter);
