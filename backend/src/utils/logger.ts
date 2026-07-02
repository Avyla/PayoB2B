import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const customFormat = winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${stack || message} ${metaString}`;
});

export const logger = winston.createLogger({
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
