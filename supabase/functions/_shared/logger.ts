export type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  msg: string;
  request_id?: string;
  timestamp: string;
}

function emit(level: LogLevel, msg: string, requestId?: string) {
  const entry: LogEntry = {
    level,
    msg,
    request_id: requestId,
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
  info: (msg: string, requestId?: string) => emit('info', msg, requestId),
  warn: (msg: string, requestId?: string) => emit('warn', msg, requestId),
  error: (msg: string, requestId?: string) => emit('error', msg, requestId),
};

export function createLogger(requestId?: string) {
  return {
    info: (msg: string) => logger.info(msg, requestId),
    warn: (msg: string) => logger.warn(msg, requestId),
    error: (msg: string) => logger.error(msg, requestId),
  };
}
