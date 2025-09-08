type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const env = process.env.NODE_ENV || 'development';

function shouldLog(level: LogLevel): boolean {
  if (env === 'test') return false;
  if (env === 'production') return level === 'warn' || level === 'error';
  return true;
}

const writers: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: (...args: unknown[]) => console.debug(...(args as [])),
  info: (...args: unknown[]) => console.info(...(args as [])),
  warn: (...args: unknown[]) => console.warn(...(args as [])),
  error: (...args: unknown[]) => console.error(...(args as [])),
};

function fmt(level: LogLevel, msg: unknown, args: unknown[]) {
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  writers[level](`${prefix} ${String(msg)}`, ...args);
}

export const logger = {
  debug: (msg: unknown, ...args: unknown[]) => {
    if (shouldLog('debug')) fmt('debug', msg, args);
  },
  info: (msg: unknown, ...args: unknown[]) => {
    if (shouldLog('info')) fmt('info', msg, args);
  },
  warn: (msg: unknown, ...args: unknown[]) => {
    if (shouldLog('warn')) fmt('warn', msg, args);
  },
  error: (msg: unknown, ...args: unknown[]) => {
    if (shouldLog('error')) fmt('error', msg, args);
  },
};
