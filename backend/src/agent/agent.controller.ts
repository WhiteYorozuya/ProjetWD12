import { Body, Controller, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PosteCourant, Public } from '../common/decorators';
import { PosteAgent } from '../common/types';
import { AgentTokenGuard } from './agent-token.guard';
import { HeartbeatDto, ResultatCommandeDto } from './agent.dto';
import { AgentService } from './agent.service';

/** API appelée par l'agent installé sur chaque poste (pas par les utilisateurs). */
@ApiTags('Agent (postes)')
@ApiSecurity('agent')
@Public() // pas de JWT : authentification par jeton d'agent
@SkipThrottle()
@UseGuards(AgentTokenGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly service: AgentService) {}

  @Post('heartbeat')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remontée périodique (≈10 s) : état, processus, applications. Renvoie les ordres à exécuter.' })
  heartbeat(@PosteCourant() poste: PosteAgent, @Body() dto: HeartbeatDto) {
    return this.service.heartbeat(poste, dto);
  }

  @Post('commandes/:id/resultat')
  @HttpCode(200)
  @ApiOperation({ summary: "Compte rendu d'exécution d'un ordre" })
  resultat(
    @PosteCourant() poste: PosteAgent,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResultatCommandeDto,
  ) {
    return this.service.resultatCommande(poste, id, dto);
  }
}
