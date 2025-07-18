import { LoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import stripAnsi from 'strip-ansi';

export class CustomLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.printf((info) => {
          const context = info.context ? ` [${info.context}] ` : ' ';

          let message: any = '';
          const arg = info.message;
          if (arg instanceof Error) {
            // 如果是 Error 对象，输出其 message, stack 和其他属性
            message = `${arg.message}\n${arg.stack}`;

            // 如果 Error 对象包含自定义字段，输出这些字段
            const customFields = Object.keys(arg).reduce((acc, key) => {
              if (key !== 'message' && key !== 'stack') {
                acc[key] = arg[key];
              }
              return acc;
            }, {});

            if (Object.keys(customFields).length > 0) {
              message += `\nCustom Fields: ${JSON.stringify(customFields, null, 2)}`;
            }
          } else {
            message =
              typeof arg === 'object'
                ? JSON.stringify(arg, null, 2)
                : typeof arg === 'string'
                  ? stripAnsi(arg)
                  : arg;
          }
          // 处理 trace
          const trace = info.trace ? `\n${info.trace}` : '';
          return `${info.timestamp}${context}${info.level.toUpperCase()}\t ${message}${trace}`;
        }),
      ),
      transports: [
        new transports.Console({
          format: format.combine(format.colorize({ all: true })),
        }),
        new DailyRotateFile({
          dirname: 'logs',
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '100m',
          maxFiles: '7d',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
