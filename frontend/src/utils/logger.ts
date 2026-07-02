const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) console.log(...args);
  },
  info: (...args: any[]) => {
    if (!isProduction) console.info(...args);
  },
  warn: (...args: any[]) => {
    if (!isProduction) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (!isProduction) console.error(...args);
  },
  debug: (...args: any[]) => {
    if (!isProduction) console.debug(...args);
  }
};
