import { Module } from '@nestjs/common';
import { SallesController } from './salles.controller';
import { SallesService } from './salles.service';

@Module({
  controllers: [SallesController],
  providers: [SallesService],
})
export class SallesModule {}
