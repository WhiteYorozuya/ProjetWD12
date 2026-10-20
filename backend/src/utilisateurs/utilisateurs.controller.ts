import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles, UtilisateurCourant } from '../common/decorators';
import { UtilisateurConnecte } from '../common/types';
import { CreerUtilisateurDto, ModifierUtilisateurDto, ReinitialiserMotDePasseDto } from './utilisateurs.dto';
import { UtilisateursService } from './utilisateurs.service';

@ApiTags('Utilisateurs')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private readonly service: UtilisateursService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les comptes' })
  lister() {
    return this.service.lister();
  }

  @Post()
  @ApiOperation({ summary: 'Créer un compte' })
  creer(@Body() dto: CreerUtilisateurDto) {
    return this.service.creer(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un compte (rôle, activation…)' })
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierUtilisateurDto,
    @UtilisateurCourant() user: UtilisateurConnecte,
  ) {
    return this.service.modifier(id, dto, user.id);
  }

  @Put(':id/mot-de-passe')
  @HttpCode(204)
  @ApiOperation({ summary: "Réinitialiser le mot de passe d'un compte" })
  async reinitialiser(@Param('id', ParseIntPipe) id: number, @Body() dto: ReinitialiserMotDePasseDto) {
    await this.service.reinitialiserMotDePasse(id, dto.motDePasse);
  }
}
