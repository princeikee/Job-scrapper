import { Router } from 'express';
import {
  listJobs,
  listRecentJobs,
  resetJobsController,
  searchJobsController,
} from '../controllers/jobsController.js';

export const jobsRouter = Router();

jobsRouter.get('/', listJobs);
jobsRouter.get('/recent', listRecentJobs);
jobsRouter.get('/search', searchJobsController);
jobsRouter.post('/reset', resetJobsController);
