import { Module } from '@nestjs/common';

import { SolSaveService } from './summarySink/sol.save.service';
import { DataCustomer } from './data.customer';

@Module({
  imports: [
  ],
  providers: [SolSaveService, DataCustomer],
})
export class DataModule {}
