import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const customFormat = winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${stack || message} ${metaString}`;
});

const winstonLogger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: !isProduction }),
    isProduction 
      ? winston.format.json() 
      : winston.format.combine(
          winston.format.colorize(),
          customFormat
        )
  ),
  transports: [
    new winston.transports.Console()
  ],
});

export const logger = {
  ...winstonLogger,
  errorWithMeta: (meta: { code: string; message: string; stack?: string; path: string; method: string; isOperational: boolean }) => {
    // 1. Siempre escribir en los logs estandarizados del contenedor (stdout/stderr)
    winstonLogger.error(`[${meta.method} ${meta.path}] [${meta.code}]: ${meta.message}`);
    if (meta.stack) winstonLogger.error(meta.stack);

    // 2. Si estamos en producción y NO es un error operativo simple (ej. un 500 real del sistema), capturar en el APM
    if (isProduction && !meta.isOperational) {
      // Ej. Sentry.captureException(meta);
      // Ej. Datadog.increment('errors.count', 1, [`code:${meta.code}`]);
    }
  }
};
