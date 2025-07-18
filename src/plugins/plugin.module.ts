import { Global, Module } from '@nestjs/common';
import { AliOssService } from './alioss.service';

@Global()
@Module({
  providers: [
    AliOssService,
  ],
  exports: [
    AliOssService,
  ],
})
export class PluginsModule {}
