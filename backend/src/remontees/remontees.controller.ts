import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles, UtilisateurCourant } from '../common/decorators';
import { UtilisateurConnecte } from '../common/types';
import { CreerRemonteeDto, FiltreRemonteesDto, TraiterRemonteeDto } from './remontees.dto';
import { RemonteesService } from './remontees.service';

@ApiTags('Remontées utilisateur')
@ApiBearerAuth()
@Controller('remontees')
export class RemonteesController {
  constructor(private readonly service: RemonteesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les remontées' })
  lister(@Query() filtre: FiltreRemonteesDto, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.service.lister(filtre, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Signaler un problème sur un poste ou une salle' })
  creer(@Body() dto: CreerRemonteeDto, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.service.creer(dto, user.id);
  }

  @Roles(Role.ADMIN_SALLE)
  @Patch(':id/traitement')
  @ApiOperation({ summary: 'Prendre en charge / résoudre une remontée' })
  traiter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TraiterRemonteeDto,
    @UtilisateurCourant() user: UtilisateurConnecte,
  ) {
    return this.service.traiter(id, dto, user.id);
  }
}
