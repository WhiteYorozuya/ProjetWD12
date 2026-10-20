import { Module } from '@nestjs/common';
import { ApplicationsController, FormationsController, TypesMaterielController } from './parametrage.controller';
import { ParametrageService } from './parametrage.service';

@Module({
  controllers: [TypesMaterielController, FormationsController, ApplicationsController],
  providers: [ParametrageService],
})
export class ParametrageModule {}
