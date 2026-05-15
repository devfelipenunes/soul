export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export class Logger {
  private level: LogLevel = LogLevel.INFO;
  private tag: string = "SoulSDK";

  constructor(level?: LogLevel, tag?: string) {
    if (level !== undefined) this.level = level;
    if (tag !== undefined) this.tag = tag;
  }

  setLogLevel(level: LogLevel) {
    this.level = level;
  }

  setTag(tag: string) {
    this.tag = tag;
  }

  private format(level: string, message: string): string {
    return `[${this.tag}:${level}] ${message}`;
  }

  error(message: string, ...args: any[]) {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.format("ERROR", message), ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.format("WARN", message), ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level >= LogLevel.INFO) {
      console.info(this.format("INFO", message), ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(this.format("DEBUG", message), ...args);
    }
  }
}


export const logger = new Logger();
