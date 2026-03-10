export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinimumLogLevel(): LogLevel {
  const isProduction = process.env['NODE_ENV'] === 'production';
  return isProduction ? 'info' : 'debug';
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const minLevel = getMinimumLogLevel();

  if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[minLevel]) {
    return;
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context !== undefined && Object.keys(context).length > 0 ? { context } : {}),
  };

  const output = JSON.stringify(entry);

  // Route error and warn to stderr, everything else to stdout
  if (level === 'error' || level === 'warn') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export const logger = {
  debug: (msg: string, context?: Record<string, unknown>): void => {
    emit('debug', msg, context);
  },
  info: (msg: string, context?: Record<string, unknown>): void => {
    emit('info', msg, context);
  },
  warn: (msg: string, context?: Record<string, unknown>): void => {
    emit('warn', msg, context);
  },
  error: (msg: string, context?: Record<string, unknown>): void => {
    emit('error', msg, context);
  },
};
