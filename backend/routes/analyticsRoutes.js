import { Router } from 'express';
import {
  dashboardOverview,
  remoteVsOnsite,
  salaryDistribution,
  topLocations,
  topSkills,
} from '../controllers/analyticsController.js';

export const analyticsRouter = Router();

analyticsRouter.get('/top-skills', topSkills);
analyticsRouter.get('/salary-distribution', salaryDistribution);
analyticsRouter.get('/top-locations', topLocations);
analyticsRouter.get('/remote-vs-onsite', remoteVsOnsite);
analyticsRouter.get('/overview', dashboardOverview);
