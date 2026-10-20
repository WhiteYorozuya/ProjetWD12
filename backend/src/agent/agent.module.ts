import { Module } from '@nestjs/common';
import { AlertesModule } from '../alertes/alertes.module';
import { SupervisionModule } from '../supervision/supervision.module';
import { AgentTokenGuard } from './agent-token.guard';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
  imports: [SupervisionModule, AlertesModule],
  controllers: [AgentController],
  providers: [AgentService, AgentTokenGuard],
})
export class AgentModule {}
