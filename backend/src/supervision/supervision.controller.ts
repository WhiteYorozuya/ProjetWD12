import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles, UtilisateurCourant } from '../common/decorators';
import { UtilisateurConnecte } from '../common/types';
import { CreerRegleDto, FiltreReglesDto } from './supervision.dto';
import { SupervisionService } from './supervision.service';

@ApiTags('Supervision')
@ApiBearerAuth()
@Controller('supervision')
export class SupervisionController {
  constructor(private readonly service: SupervisionService) {}

  @Roles(Role.ADMIN_SALLE, Role.FORMATEUR)
  @Get('salles/:salleId')
  @ApiOperation({ summary: "Vue temps réel d'une salle : postes, CPU/RAM, processus" })
  vueSalle(@Param('salleId', ParseIntPipe) salleId: number) {
    return this.service.vueSalle(salleId);
  }

  @Roles(Role.ADMIN_SALLE, Role.FORMATEUR)
  @Post('postes/:posteId/processus/:pid/tuer')
  @HttpCode(202)
  @ApiOperation({ summary: 'Tuer un processus (exécuté par l’agent au prochain heartbeat)' })
  tuer(
    @Param('posteId', ParseIntPipe) posteId: number,
    @Param('pid', ParseIntPipe) pid: number,
    @UtilisateurCourant() user: UtilisateurConnecte,
  ) {
    return this.service.tuerProcessus(posteId, pid, user.id);
  }

  @Get('regles')
  @ApiOperation({ summary: 'Règles de processus (globales + salle)' })
  listerRegles(@Query() filtre: FiltreReglesDto) {
    return this.service.listerRegles(filtre.salleId);
  }

  @Roles(Role.ADMIN_SALLE)
  @Post('regles')
  @ApiOperation({ summary: 'Autoriser ou interdire un processus' })
  creerRegle(@Body() dto: CreerRegleDto) {
    return this.service.creerRegle(dto);
  }

  @Roles(Role.ADMIN_SALLE)
  @Delete('regles/:id')
  @HttpCode(204)
  async supprimerRegle(@Param('id', ParseIntPipe) id: number) {
    await this.service.supprimerRegle(id);
  }
}
