export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export class Logger {
  private level: LogLevel = LogLevel.INFO;

  constructor(level?: LogLevel) {
    if (level !== undefined) this.level = level;
  }

  setLogLevel(level: LogLevel) {
    this.level = level;
  }

  error(message: string, ...args: any[]) {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ZolvencySDK:ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[ZolvencySDK:WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level >= LogLevel.INFO) {
      console.info(`[ZolvencySDK:INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[ZolvencySDK:DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
