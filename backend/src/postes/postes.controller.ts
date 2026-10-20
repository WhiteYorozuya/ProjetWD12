import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles, UtilisateurCourant } from '../common/decorators';
import { UtilisateurConnecte } from '../common/types';
import { CreerPosteDto, DeclarerApplicationDto, FiltrePostesDto, ModifierPosteDto } from './postes.dto';
import { PostesService } from './postes.service';

@ApiTags('Postes')
@ApiBearerAuth()
@Controller('postes')
export class PostesController {
  constructor(private readonly service: PostesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les postes (état en ligne, compteurs)' })
  lister(@Query() filtre: FiltrePostesDto) {
    return this.service.lister(filtre.salleId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Fiche d'un poste : applications, processus, réinstallations, remontées" })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Roles(Role.ADMIN_SALLE)
  @Post()
  @ApiOperation({ summary: "Déclarer un poste — renvoie le jeton de l'agent (affiché une seule fois)" })
  creer(@Body() dto: CreerPosteDto) {
    return this.service.creer(dto);
  }

  @Roles(Role.ADMIN_SALLE)
  @Post(':id/jeton')
  @HttpCode(200)
  @ApiOperation({ summary: "Régénérer le jeton de l'agent (l'ancien est révoqué)" })
  regenererJeton(@Param('id', ParseIntPipe) id: number) {
    return this.service.regenererJeton(id);
  }

  @Roles(Role.ADMIN_SALLE)
  @Patch(':id')
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierPosteDto,
    @UtilisateurCourant() user: UtilisateurConnecte,
  ) {
    return this.service.modifier(id, dto, user.id);
  }

  @Roles(Role.ADMIN_SALLE)
  @Delete(':id')
  @HttpCode(204)
  async supprimer(@Param('id', ParseIntPipe) id: number) {
    await this.service.supprimer(id);
  }

  @Roles(Role.ADMIN_SALLE)
  @Post(':id/applications')
  @ApiOperation({ summary: 'Déclarer manuellement une application installée' })
  declarerApplication(@Param('id', ParseIntPipe) id: number, @Body() dto: DeclarerApplicationDto) {
    return this.service.declarerApplication(id, dto);
  }

  @Roles(Role.ADMIN_SALLE)
  @Delete(':id/applications/:applicationId')
  @HttpCode(204)
  async retirerApplication(
    @Param('id', ParseIntPipe) id: number,
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    await this.service.retirerApplication(id, applicationId);
  }
}
