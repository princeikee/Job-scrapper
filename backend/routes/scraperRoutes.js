import { Router } from 'express';
import { runScraper } from '../controllers/scraperController.js';

export const scraperRouter = Router();

scraperRouter.post('/run', runScraper);
