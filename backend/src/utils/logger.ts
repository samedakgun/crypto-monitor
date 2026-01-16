import fs from 'fs';
import path from 'path';

class Logger {
  private logFile: string;

  constructor() {
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFile = path.join(logsDir, `app-${this.getDateString()}.log`);
  }

  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private writeToFile(level: string, message: string, ...args: unknown[]): void {
    const serializedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    const logMessage = `[${this.getTimestamp()}] [${level}] ${message}${serializedArgs}\n`;
    fs.appendFileSync(this.logFile, logMessage);
  }

  info(message: string, ...args: unknown[]): void {
    console.log(`[INFO] ${message}`, ...args);
    this.writeToFile('INFO', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
    this.writeToFile('WARN', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
    this.writeToFile('ERROR', message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, ...args);
      this.writeToFile('DEBUG', message, ...args);
    }
  }
}

export const logger = new Logger();
