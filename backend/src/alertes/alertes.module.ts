import { Module } from '@nestjs/common';
import { AlertesController } from './alertes.controller';
import { AlertesService } from './alertes.service';
import { TachesService } from './taches.service';

@Module({
  controllers: [AlertesController],
  providers: [AlertesService, TachesService],
  exports: [AlertesService, TachesService],
})
export class AlertesModule {}
