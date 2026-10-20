import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles, UtilisateurCourant } from '../common/decorators';
import { UtilisateurConnecte } from '../common/types';
import { DemanderReinstallationDto, FiltreReinstallationsDto } from './reinstallations.dto';
import { ReinstallationsService } from './reinstallations.service';

@ApiTags('Réinstallations')
@ApiBearerAuth()
@Controller('reinstallations')
export class ReinstallationsController {
  constructor(private readonly service: ReinstallationsService) {}

  @Get()
  @ApiOperation({ summary: 'Suivi des réinstallations' })
  lister(@Query() filtre: FiltreReinstallationsDto) {
    return this.service.lister(filtre);
  }

  @Roles(Role.ADMIN_SALLE)
  @Post('poste/:posteId')
  @ApiOperation({ summary: "Lancer la réinstallation d'un poste" })
  demanderPoste(
    @Param('posteId', ParseIntPipe) posteId: number,
    @Body() dto: DemanderReinstallationDto,
    @UtilisateurCourant() user: UtilisateurConnecte,
  ) {
    return this.service.demanderPourPoste(posteId, dto.image, user.id);
  }

  @Roles(Role.ADMIN_SALLE)
  @Post('salle/:salleId')
  @ApiOperation({ summary: 'Replaquer une salle (réinstaller tous ses postes)' })
  replaquer(
    @Param('salleId', ParseIntPipe) salleId: number,
    @Body() dto: DemanderReinstallationDto,
    @UtilisateurCourant() user: UtilisateurConnecte,
  ) {
    return this.service.replaquerSalle(salleId, dto.image, user.id);
  }

  @Roles(Role.ADMIN_SALLE)
  @Post(':id/annuler')
  @HttpCode(200)
  @ApiOperation({ summary: 'Annuler une demande pas encore transmise' })
  annuler(@Param('id', ParseIntPipe) id: number) {
    return this.service.annuler(id);
  }
}
