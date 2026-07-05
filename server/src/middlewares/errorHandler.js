import logger from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error: ${message} (Status: ${statusCode})`);
  if (err.stack && process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

export default errorHandler;
