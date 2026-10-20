import { Module } from '@nestjs/common';
import { RemonteesController } from './remontees.controller';
import { RemonteesService } from './remontees.service';

@Module({
  controllers: [RemonteesController],
  providers: [RemonteesService],
})
export class RemonteesModule {}
