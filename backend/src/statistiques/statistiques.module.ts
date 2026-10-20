import { Module } from '@nestjs/common';
import { MaterielsModule } from '../materiels/materiels.module';
import { StatistiquesController } from './statistiques.controller';
import { StatistiquesService } from './statistiques.service';

@Module({
  imports: [MaterielsModule],
  controllers: [StatistiquesController],
  providers: [StatistiquesService],
})
export class StatistiquesModule {}
