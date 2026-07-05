import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

export function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Ocurrió un error inesperado en el servidor. Por favor, inténtalo más tarde.';

  if (err instanceof AppError && err.isOperational) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === 'PrismaClientKnownRequestError' || err.message?.includes('database')) {
    statusCode = 400;
    code = 'DATABASE_INTEGRITY_ERROR';
    message = 'Error de consistencia en los datos provistos. Verifique la información.';
  }

  logger.errorWithMeta({
    code,
    message: err.message || message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    isOperational: err instanceof AppError ? err.isOperational : false
  });

  res.status(statusCode).json({
    status: 'error',
    code,
    message
  });
}
