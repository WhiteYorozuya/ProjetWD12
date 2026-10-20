import { Module } from '@nestjs/common';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';

@Module({
  controllers: [UtilisateursController],
  providers: [UtilisateursService],
})
export class UtilisateursModule {}
