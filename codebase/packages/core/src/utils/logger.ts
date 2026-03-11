export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  traceId?: string;
  context?: Record<string, unknown>;
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinimumLogLevel(): LogLevel {
  const envLevel = process.env['LOG_LEVEL'] as LogLevel | undefined;
  if (envLevel !== undefined && envLevel in LOG_LEVEL_ORDER) {
    return envLevel;
  }
  const isProduction = process.env['NODE_ENV'] === 'production';
  return isProduction ? 'info' : 'debug';
}

export interface Logger {
  debug: (msg: string, context?: Record<string, unknown>) => void;
  info: (msg: string, context?: Record<string, unknown>) => void;
  warn: (msg: string, context?: Record<string, unknown>) => void;
  error: (msg: string, context?: Record<string, unknown>) => void;
  child: (defaults: Record<string, unknown>) => Logger;
}

function createLogger(defaults?: Record<string, unknown>): Logger {
  const baseContext = defaults ?? {};

  function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const minLevel = getMinimumLogLevel();

    if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[minLevel]) {
      return;
    }

    const merged = { ...baseContext, ...context };

    // Pull out well-known top-level fields
    const { service, traceId, ...rest } = merged;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(typeof service === 'string' ? { service } : {}),
      ...(typeof traceId === 'string' ? { traceId } : {}),
      ...(Object.keys(rest).length > 0 ? { context: rest } : {}),
    };

    const output = JSON.stringify(entry);

    // Route error and warn to stderr, everything else to stdout
    if (level === 'error' || level === 'warn') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }

  return {
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
    child: (childDefaults: Record<string, unknown>): Logger => {
      return createLogger({ ...baseContext, ...childDefaults });
    },
  };
}

export const logger: Logger = createLogger();
