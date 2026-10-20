import { Module } from '@nestjs/common';
import { PostesController } from './postes.controller';
import { PostesService } from './postes.service';

@Module({
  controllers: [PostesController],
  providers: [PostesService],
})
export class PostesModule {}
