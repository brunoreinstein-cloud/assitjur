/**
 * Sistema de logging centralizado para AssistJur.IA
 * Substitui console.error/console.warn diretos por um sistema estruturado
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
  service?: string;
}

class Logger {
  private isDevelopment = !import.meta.env.PROD;

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    service?: string,
  ) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      service,
    };

    // Em desenvolvimento, usa console padrão
    if (this.isDevelopment) {
      const contextStr = context ? ` ${JSON.stringify(context, null, 2)}` : "";
      const serviceStr = service ? `[${service}] ` : "";

      switch (level) {
        case "error":
          console.error(`❌ ${serviceStr}${message}${contextStr}`);
          break;
        case "warn":
          console.warn(`⚠️ ${serviceStr}${message}${contextStr}`);
          break;
        case "info":
          console.log(`ℹ️ ${serviceStr}${message}${contextStr}`);
          break;
        case "debug":
          console.debug(`🔍 ${serviceStr}${message}${contextStr}`);
          break;
      }
    } else {
      // Em produção, pode integrar com serviço externo (Sentry, etc.)
      // Por agora, apenas log estruturado no console
      console.log(JSON.stringify(entry));
    }
  }

  info(message: string, context?: Record<string, any>, service?: string) {
    this.log("info", message, context, service);
  }

  warn(message: string, context?: Record<string, any>, service?: string) {
    this.log("warn", message, context, service);
  }

  error(message: string, context?: Record<string, any>, service?: string) {
    this.log("error", message, context, service);
  }

  debug(message: string, context?: Record<string, any>, service?: string) {
    this.log("debug", message, context, service);
  }
}

export const logger = new Logger();

// Utilitários para migrations graduais
export const logError = (
  message: string,
  context?: Record<string, any>,
  service?: string,
) => logger.error(message, context, service);

export const logWarn = (
  message: string,
  context?: Record<string, any>,
  service?: string,
) => logger.warn(message, context, service);

export const logInfo = (
  message: string,
  context?: Record<string, any>,
  service?: string,
) => logger.info(message, context, service);
