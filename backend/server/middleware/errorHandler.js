import { logger } from '../logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `No route for ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode ?? 500;
  const payload = {
    error: err.name ?? 'Error',
    message: err.message ?? 'Internal Server Error',
  };

  if (err.details) {
    payload.details = err.details;
  }

  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      path: req.originalUrl,
      method: req.method,
    },
    'Request failed'
  );

  res.status(statusCode).json(payload);
}
