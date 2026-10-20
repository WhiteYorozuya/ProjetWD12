import { Module } from '@nestjs/common';
import { ReinstallationsController } from './reinstallations.controller';
import { ReinstallationsService } from './reinstallations.service';

@Module({
  controllers: [ReinstallationsController],
  providers: [ReinstallationsService],
})
export class ReinstallationsModule {}
