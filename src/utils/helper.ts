import { Logger } from '@nestjs/common';
import { RedisService } from '@zqlc/redis';
import BigNumber from 'bignumber.js';
import { createHash } from 'crypto';
import fs, { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';


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

/**
 * md5
 * @param data
 * @returns
 */
export function md5(data: string) {
  return createHash('md5').update(data).digest('hex');
}

export function consoleLogger(walletAddress: string, msg: string, type?: string) {
  if (type != 'saveDB') {
    return;
  }
  // return;
  console.log(`Wallet: ${walletAddress}, Message: ${msg}, Type: ${type}`);
}

export function generateTableName(
  prefix: string,
  partitionKey: string[],
  data: Record<string, any>,
  modNumber: number = 128,
): string {
  if (partitionKey.length === 0) {
    console.log(`generateTableName: partitionKey is empty, using prefix: ${prefix}`);
    return prefix;
  }
  const partitionValues = partitionKey.map((key) => data[key]);
  const key = partitionValues.join('_');
  if (!key) {
    console.log(`generateTableName: key is empty, using prefix: ${prefix}`);
    return prefix;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return `${prefix}_${Math.abs(hash) % modNumber}`;
}

// 保存数据
export function saveDataToFile(filename: string, data: any): void {
  const serializedData = JSON.stringify(data, (_, value) => {
    if (Buffer.isBuffer(value)) {
      return { type: 'Buffer', data: value.toString('base64') }; // 将 Buffer 转为 Base64
    }
    return value;
  });
  writeFileSync(filename, serializedData, 'utf8');
}

// 读取数据
export function loadDataFromFile(filename: string): any {
  const rawData = readFileSync(filename, 'utf8');
  return JSON.parse(rawData, (_, value) => {
    if (value && value.type === 'Buffer') {
      return Buffer.from(value.data, 'base64'); // 将 Base64 转回 Buffer
    }
    return value;
  });
}

export function saveDataStreamToFile(filename: string, msg: string) {
  const baseLogPath = path.resolve('./logs');
  // 创建一个可写流，设置 `flags: 'a'` 来进行追加写入
  const writeStream = fs.createWriteStream(`${baseLogPath}/${filename}`, {
    flags: 'a',
    encoding: 'utf8',
  });
  // 写入数据
  writeStream.write(`${msg}\n`);
  // 关闭流
  writeStream.end();
}

export async function lock<T>(
  redisService: RedisService,
  lockKey: string,
  fn: () => Promise<T>,
): Promise<boolean | T> {
  const client = redisService.getClient();
  // 加锁
  const value = await redisService.lock(client, lockKey);
  if (!value) {
    // 没获得锁
    // console.log(`获取锁失败: ${lockKey}`);
    return false;
  }
  // console.log(`获得锁: ${lockKey}`);

  try {
    return await fn();
  } catch (error) {
    throw error;
  } finally {
    // 解锁
    await redisService.unlock(client, lockKey, value);
    // console.log(`释放锁: ${lockKey}`);
  }
}

export function generateClearSQL(
  tableName: string,
  columns: string[],
  data: Record<string, any>,
  whereCondition: string,
): { sql: string; values: any[] } {
  // 确定哪些字段需要更新
  const updateClauses = columns.map((column) => {
    if (column in data) {
      return `${column} = ?`; // 数据中有的字段，使用对应的值
    } else {
      return `${column} = DEFAULT`; // 其他字段设为 DEFAULT
    }
  });

  // 拼接更新语句
  const sql = `
      UPDATE ${tableName}
      SET ${updateClauses.join(', ')}
      WHERE ${whereCondition};
    `;

  // 提取需要的值，顺序要与updateClauses一致，所以不能直接用Object.values(data)
  const values = columns
    .filter((column) => column in data)
    .map((column) => data[column]);

  return { sql: sql.trim(), values };
}

export function generateInsertOnDuplicateSQL(
  tableName: string,
  columns: string[],
  uniqueColumns: string[],
  data: Record<string, any> | Record<string, any>[],
  partitionKey?: string[],
): { sql: string; values: any[] } {
  // 兼容单条记录的情况，将其包装为数组
  const records = Array.isArray(data) ? data : [data];
  const values: any[] = [];
  const sqlStatements: string[] = [];

  // 为每条记录生成单独的插入语句
  for (const record of records) {
    // 构造 INSERT 的字段部分
    const insertFields = `(${columns.join(', ')})`;

    // 构造单条记录的 VALUES 部分
    let insertTable = tableName;
    if (partitionKey && partitionKey.length > 0) {
      // 如果有分区键，生成分区表名
      insertTable = generateTableName(
        tableName,
        partitionKey,
        record,
      );
    }
    const placeholders = columns.map((field) => {
      if (field in record) {
        values.push(record[field]); // 添加对应值到统一的values数组
        return '?';
      } else {
        return 'DEFAULT';
      }
    });

    const valuesPart = `(${placeholders.join(', ')})`;

    // 构造 ON DUPLICATE KEY UPDATE 部分
    const onDuplicateKeyUpdate = columns
      .filter((field) => !uniqueColumns.includes(field))
      .map((field) => `${field} = VALUES(${field})`)
      .join(', ');

    // 生成完整的单条SQL语句
    const singleSql = `
      INSERT INTO ${insertTable} ${insertFields} 
      VALUES ${valuesPart} 
      ON DUPLICATE KEY UPDATE 
      ${onDuplicateKeyUpdate}`;

    // 添加到SQL语句数组
    sqlStatements.push(singleSql);
  }

  // 将所有SQL语句合并为一个字符串，用分号连接
  const combinedSql = sqlStatements.join(';');

  return {
    sql: combinedSql,
    values,
  };
}

export function generateInsertOnDuplicatePgSql(
  config: PostgresConnectionOptions,
  tableName: string,
  columns: string[],
  uniqueColumns: string[],
  data: Record<string, any> | Record<string, any>[],
  partitionKey?: string[],
): { sql: string; values: any[] }[] {
  // 兼容单条记录的情况，将其包装为数组
  const records = Array.isArray(data) ? data : [data];
  
  if (records.length === 0) {
    console.warn('generateInsertOnDuplicatePgSql: 输入数据为空');
    return [];
  }

  // 按分表进行分组
  const tableGroups = new Map<string, any[]>();
  
  records.forEach(record => {
    let tableName_real = tableName;
    if (partitionKey && partitionKey.length > 0) {
      tableName_real = generateTableName(tableName, partitionKey, record);
    }
    
    if (!tableGroups.has(tableName_real)) {
      tableGroups.set(tableName_real, []);
    }
    tableGroups.get(tableName_real)!.push(record);
  });

  const results: { sql: string; values: any[] }[] = [];

  // 为每个分表生成批量插入SQL
  for (const [currentTableName, tableRecords] of tableGroups) {
    if (tableRecords.length === 0) {
      console.warn(`generateInsertOnDuplicatePgSql: 分组 ${currentTableName} 为空，跳过`);
      continue; // 跳过空分组
    }

    const insertFields = `("${columns.join('", "')}")`;
    const conflictColumns = uniqueColumns.map(col => `"${col}"`).join(', ');
    const updateSet = columns
      .filter((field) => !uniqueColumns.includes(field))
      .map((field) => `"${field}" = EXCLUDED."${field}"`)
      .join(', ');

    // 生成 VALUES 部分
    const allValues: any[] = [];
    const valueGroups: string[] = [];
    
    // 为每条记录生成值组和占位符
    tableRecords.forEach((record, recordIndex) => {
      const recordValues: any[] = [];
      const placeholders: string[] = [];
      
      // 为每个字段生成占位符
      columns.forEach((field, fieldIndex) => {
        if (field in record && record[field] !== undefined) {
          recordValues.push(record[field]);
          // 正确计算占位符索引：当前总参数数量 + 当前记录中的参数索引 + 1
          placeholders.push(`$${allValues.length + recordValues.length}`);
        } else {
          // 对于缺失字段，使用 DEFAULT 而不是参数占位符
          placeholders.push('DEFAULT');
        }
      });
      
      // 添加调试日志
      if (columns.includes('wallet_address')) {
        consoleLogger(
          record.wallet_address,
          `表: ${currentTableName}, 记录${recordIndex + 1}/${tableRecords.length}, 字段数: ${columns.length}, 参数数: ${recordValues.length}`,
        );
      }
      
      // 将当前记录的参数添加到总参数数组
      allValues.push(...recordValues);
      valueGroups.push(`(${placeholders.join(', ')})`);
    });

    const fullTableName = config.schema ? `"${config.schema}"."${currentTableName}"` : `"${currentTableName}"`;
    const sql = `
      INSERT INTO ${fullTableName} ${insertFields}
      VALUES ${valueGroups.join(', ')}
      ON CONFLICT (${conflictColumns}) DO UPDATE SET
      ${updateSet}`;

    // 验证参数数量
    const placeholderCount = (sql.match(/\$\d+/g) || []).length;
    const actualParamCount = allValues.length;
    
    if (placeholderCount !== actualParamCount) {
      console.error(`参数数量不匹配: SQL有${placeholderCount}个占位符，但提供了${actualParamCount}个参数`);
      console.error(`表: ${currentTableName}, 记录数: ${tableRecords.length}`);
      console.error(`SQL预览: ${sql.substring(0, 500)}...`);
      console.error(`参数预览: ${JSON.stringify(allValues.slice(0, 10))}...`);
      // 跳过有问题的SQL
      continue;
    }

    results.push({
      sql: sql.trim(),
      values: allValues,
    });
  }

  return results;
}

export function generateBatchUpdateSQL(
  tableName: string,
  columns: string[],
  data: Record<string, any>[],
  whereColumn: string = 'id',
  defaultColumns: string[] = [],
): { sql: string; values: any[] } {
  // 如果没有数据，返回空结果
  if (!data.length) {
    return { sql: '', values: [] };
  }

  // 构造 CASE WHEN 语句
  const caseStatements = columns
    .map((column) => {
      if (column === whereColumn) return null; // 跳过 WHERE 列

      const cases = data
        .map((row, index) => {
          return `WHEN ? THEN ?`;
        })
        .join(' ');

      return `${column} = CASE ${whereColumn} ${cases} ELSE ${column} END`;
    })
    .filter(Boolean); // 过滤掉 null 值

  // 提取 WHERE IN 子句的 ID 列表
  const whereValues = data.map((row) => row[whereColumn]);

  const defaultSet = defaultColumns.map((column) => {
    return `${column} = DEFAULT`;
  });
  caseStatements.push(...defaultSet);

  // 构造最终的 SQL 语句
  const sql = `
    UPDATE ${tableName}
    SET ${caseStatements.join(', ')}
    WHERE ${whereColumn} IN (${whereValues.map(() => '?').join(', ')})
  `;

  // 构建参数值数组
  const values: any[] = [];

  // 为每个 CASE WHEN 添加参数
  columns.forEach((column) => {
    if (column === whereColumn) return; // 跳过 WHERE 列

    data.forEach((row) => {
      values.push(row[whereColumn]); // WHEN ? 的参数
      values.push(row[column]); // THEN ? 的参数
    });
  });

  // 添加 WHERE IN 子句的参数
  values.push(...whereValues);

  return { sql: sql.trim(), values };
}

export function generateInsertSQL(
  tableName: string,
  columns: string[],
  data: Record<string, any> | Record<string, any>[],
): { sql: string; values: any[] } {
  // 兼容单条记录的情况，将其包装为数组
  const records = Array.isArray(data) ? data : [data];
  const values: any[] = [];

  // 构造 INSERT 的字段部分
  const insertFields = `(${columns.join(', ')})`;

  // 构造 VALUES 部分
  const valuesPart = records
    .map((record) => {
      const placeholders = columns.map((field) => {
        if (field in record) {
          values.push(record[field]); // 添加对应值
          return '?';
        } else {
          return 'DEFAULT';
        }
      });
      return `(${placeholders.join(', ')})`;
    })
    .join(', ');
  const sql = `
    INSERT INTO ${tableName} ${insertFields} 
    VALUES ${valuesPart};
  `;

  return { sql: sql.trim(), values };
}

export function generateIncrInsertOnDuplicateSQL(
  tableName: string,
  columns: string[],
  uniqueColumns: string[],
  data: Record<string, any> | Record<string, any>[],
  specialColumns?: { [key: string]: string },
): { sql: string; values: any[] } {
  // 兼容单条记录的情况，将其包装为数组
  const records = Array.isArray(data) ? data : [data];
  const values: any[] = [];
  const sqlStatements: string[] = [];
  
  // 构造 INSERT 的字段部分
  const insertFields = `(${columns.join(', ')})`;
  // 构造 ON DUPLICATE KEY UPDATE 部分
  const onDuplicateKeyUpdate = columns
    .filter((field) => !uniqueColumns.includes(field))
    .map((field) => {
      if (specialColumns && field in specialColumns) {
        return `${field} = ${specialColumns[field]}`;
      } else {
        return `${field} = ${field} + VALUES(${field})`;
      }
    })
    .join(', ');
  // 构造 VALUES 部分
  const valuesPart = records
    .map((record) => {
      const placeholders = columns.map((field) => {
        if (field in record) {
          values.push(record[field]); // 添加对应值
          return '?';
        } else {
          return 'DEFAULT';
        }
      });
      return `(${placeholders.join(', ')})`;
    })
    .join(', ');
  const sql = `
    INSERT INTO ${tableName} ${insertFields} 
    VALUES ${valuesPart} 
    ON DUPLICATE KEY UPDATE 
    ${onDuplicateKeyUpdate};
  `;
  // 为每条记录生成单独的插入语句
//   for (const record of records) {

//     // 构造单条记录的 VALUES 部分
//     const placeholders = columns.map((field) => {
//       if (field in record) {
//         values.push(record[field]); // 添加对应值到统一的values数组
//         return '?';
//       } else {
//         return 'DEFAULT';
//       }
//     });

//     const valuesPart = `(${placeholders.join(', ')})`;


//     // 生成完整的单条SQL语句
//     const singleSql = `
// INSERT INTO ${tableName} ${insertFields} 
// VALUES ${valuesPart} 
// ON DUPLICATE KEY UPDATE 
// ${onDuplicateKeyUpdate}`;

//     // 添加到SQL语句数组
//     sqlStatements.push(singleSql);
//   }

//   // 将所有SQL语句合并为一个字符串
//   const combinedSql = sqlStatements.join(';');

  return {
    sql: sql.trim(),
    values,
  };
}

export function checkInvalidNumber(number: BigNumber) {
  if (number.isNaN() || number.isZero()) {
    // 如果是 NaN 或 0，返回 0
    return '0';
  } else if (number.isInteger()){
    // 如果是整数，直接返回字符串形式
    return number.toString();
  } else {
    // 如果是小数，返回固定小数点格式，保留18位小数
    return number.toFixed(18);
  }
}

export function normalizeBigNumberFieldsInPlace(list: any[]): void {
  list.forEach((item) => {
    for (const key in item) {
      if (BigNumber.isBigNumber(item[key])) {
        const value = item[key];
        if (value.isNaN()) {
          consoleLogger(
            item?.wallet_address,
            `Invalid BigNumber detected in ${key}: ${value}, item:`,
          );
        }
        // 原地修改，将 BigNumber 值替换为 checkInvalidNumber 的返回值
        item[key] = checkInvalidNumber(item[key]);
      }
    }
  });
}

