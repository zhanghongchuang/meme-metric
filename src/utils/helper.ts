import { Logger } from '@nestjs/common';

/**
 * 等待函数
 * @param milliseconds 毫秒
 */
export function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function getChainAddress(chain: string, address: string): string {
  if (chain && chain.startsWith('evm')) {
    return address.toLowerCase();
  }
  return address;
}

export function getStartOfDay(timestamp: number): number {
  return getStartOfMinute(timestamp, 24 * 60);
}

export function getStartOfMinute(timestamp: number, minute: number): number {
  const ms = minute * 60; // 一分钟的秒数
  return Math.floor(timestamp / ms) * ms;
}

export function MeasureTime() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // 保存原始方法引用
    const originalMethod = descriptor.value;

    // 替换原始方法
    descriptor.value = async function (...args: any[]) {
      // 创建类名用于日志
      const className = target.constructor.name;

      // 记录开始时间
      const start = Date.now();

      // 调用原始方法
      let result;
      try {
        // 判断原始方法是否为异步函数
        if (originalMethod.constructor.name === 'AsyncFunction') {
          result = await originalMethod.apply(this, args);
        } else {
          result = originalMethod.apply(this, args);
        }

        // 计算执行时间
        const executionTime = Date.now() - start;
        if (executionTime > 1000) {
          // 打印警告日志
          Logger.warn(
            `${className}.${propertyKey} 执行时间过长: ${executionTime}ms`,
            'TimeMeasure',
          );
        }

        return result;
      } catch (error) {
        // 计算执行时间（包括错误情况）
        const executionTime = Date.now() - start;

        // 打印错误日志
        Logger.error(
          `${className}.${propertyKey} 执行失败，耗时: ${executionTime}ms`,
          error.stack,
          'TimeMeasure',
        );

        // 重新抛出错误
        throw error;
      }
    };

    return descriptor;
  };
}