import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { apiRouter } from '../routes/index.js';
import { logger } from './logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
    })
  );

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
