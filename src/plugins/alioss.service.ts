import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { sleep } from '../utils/helper';
import { Readable } from 'stream';

@Injectable()
export class AliOssService {
  private client: OSS;
  constructor(private readonly configService: ConfigService) {
    this.client = new OSS(this.configService.get('alioss'));
  }

  // 获取 oss 文件内容
  async getOssFileContent(key: string) {
    try {
      const response = await this.client.get(key);
      return Buffer.from(response.content).toString();
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return '';
      }
      Logger.error({
        title: this.constructor.name + '-getOssFileContent-err',
        data: '',
        error: {
          data: error?.response?.data ?? [],
          msg: error?.message ?? error + '',
        },
      });
    }
    return -1;
  }

  // 上传文件
  async putOssFile(key: string, data: any) {
    let times = 3;
    while (times) {
      try {
        const stream = Readable.from(JSON.stringify(data));
        return await this.client.putStream(key, stream);
      } catch (error) {
        if (times <= 1) {
          Logger.error({
            title: this.constructor.name + '-putOssFile-err',
            data: '',
            error: {
              data: error?.response?.data ?? [],
              msg: error?.message ?? error + '',
            },
          });
          throw error;
        }
      }
      times--;
      await sleep(300);
    }
  }

  // 删除文件
  async deleteOssFile(key: string) {
    let times = 3;
    while (times) {
      try {
        return await this.client.delete(key);
      } catch (error) {
        if (times <= 1) {
          Logger.error({
            title: this.constructor.name + '-deleteOssFile-err',
            data: '',
            error: {
              data: error?.response?.data ?? [],
              msg: error?.message ?? error + '',
            },
          });
          throw error;
        }
      }
      times--;
      await sleep(300);
    }
  }

  /**
   * 批量删除
   * 1.如果您需要删除所有前缀为src的文件，则prefix设置为src。
   *   设置为src后，所有前缀为src的非目录文件、src目录以及目录下的所有文件均会被删除。
   * 2.如果您仅需要删除src目录及目录下的所有文件，则prefix设置为src/
   * 3.前缀prefix的值为空字符串或者NULL，将会删除整个Bucket内的所有文件，请谨慎使用。
   * @param prefix
   * @returns
   */
  async deletePrefix(prefix: string) {
    const response: any[] = [];

    while (true) {
      const list = await this.client.list({
        prefix: prefix,
        'max-keys': 500,
      });

      const objects = list.objects || [];

      if (!objects.length) {
        return response;
      }

      const result = await Promise.all(
        objects.map(async (v: any) => await this.deleteOssFile(v.name)),
      );
      response.push(...result);
    }
  }

  async getPrefix(prefix: string, limit = 100, marker = '') {
    const data = {
      files: [] as any[],
      next: '',
    };

    const list = await this.client.list({
      prefix: prefix,
      marker,
      'max-keys': limit,
    });

    const objects = list.objects || [];

    if (!objects.length) {
      return data;
    }

    const result = await Promise.all(
      objects.map(async (v: any) => await this.getOssFileContent(v.name)),
    );
    data.files.push(...result);
    data.next = list.nextMarker;
    return data;
  }
}
