export type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  msg: string;
  correlation_id?: string;
  timestamp: string;
}

function emit(level: LogLevel, msg: string, correlationId?: string) {
  const entry: LogEntry = {
    level,
    msg,
    correlation_id: correlationId,
    timestamp: new Date().toISOString(),
  };
  const json = JSON.stringify(entry);
  switch (level) {
    case 'error':
      console.error(json);
      break;
    case 'warn':
      console.warn(json);
      break;
    default:
      console.log(json);
  }
}

export const logger = {
  info: (msg: string, correlationId?: string) => emit('info', msg, correlationId),
  warn: (msg: string, correlationId?: string) => emit('warn', msg, correlationId),
  error: (msg: string, correlationId?: string) => emit('error', msg, correlationId),
};

export function createLogger(correlationId?: string) {
  return {
    info: (msg: string) => logger.info(msg, correlationId),
    warn: (msg: string) => logger.warn(msg, correlationId),
    error: (msg: string) => logger.error(msg, correlationId),
  };
}
