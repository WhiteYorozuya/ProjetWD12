import { Module } from '@nestjs/common';
import { MaterielsController } from './materiels.controller';
import { MaterielsService } from './materiels.service';

@Module({
  controllers: [MaterielsController],
  providers: [MaterielsService],
  exports: [MaterielsService],
})
export class MaterielsModule {}
