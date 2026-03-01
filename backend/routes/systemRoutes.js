import { Router } from 'express';
import { systemStatus } from '../controllers/systemController.js';

export const systemRouter = Router();

systemRouter.get('/status', systemStatus);
