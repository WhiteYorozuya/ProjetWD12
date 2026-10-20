import { Body, Controller, Delete, Get, Header, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles, UtilisateurCourant } from '../common/decorators';
import { UtilisateurConnecte } from '../common/types';
import {
  AffectationGroupeeDto,
  AffecterMaterielDto,
  CreerMaterielDto,
  ImportMaterielsDto,
  ModifierMaterielDto,
  RechercheMaterielDto,
} from './materiels.dto';
import { MaterielsService } from './materiels.service';

@ApiTags('Matériels')
@ApiBearerAuth()
@Controller('materiels')
export class MaterielsController {
  constructor(private readonly service: MaterielsService) {}

  @Get()
  @ApiOperation({ summary: 'Rechercher des matériels (paginé)' })
  rechercher(@Query() dto: RechercheMaterielDto) {
    return this.service.rechercher(dto);
  }

  @Roles(Role.GESTIONNAIRE)
  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="inventaire-materiels.csv"')
  @ApiProduces('text/csv')
  @ApiOperation({ summary: "Exporter tout l'inventaire en CSV" })
  exporter() {
    return this.service.exporterCsv();
  }

  @Roles(Role.GESTIONNAIRE)
  @Post('import')
  @HttpCode(200)
  @ApiOperation({ summary: 'Importer un lot de matériels (CSV). Tout ou rien.' })
  importer(@Body() dto: ImportMaterielsDto, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.service.importer(dto, user.id);
  }

  @Roles(Role.GESTIONNAIRE)
  @Post('affectation-groupee')
  @HttpCode(200)
  @ApiOperation({ summary: 'Déplacer plusieurs matériels vers une salle / un poste' })
  affecterGroupe(@Body() dto: AffectationGroupeeDto, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.service.affecterGroupe(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: "Fiche d'un matériel avec historique des mouvements" })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Roles(Role.GESTIONNAIRE)
  @Post()
  @ApiOperation({ summary: 'Ajouter un matériel' })
  creer(@Body() dto: CreerMaterielDto, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.service.creer(dto, user.id);
  }

  @Roles(Role.GESTIONNAIRE)
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un matériel (hors localisation)' })
  modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierMaterielDto) {
    return this.service.modifier(id, dto);
  }

  @Roles(Role.GESTIONNAIRE)
  @Post(':id/affectation')
  @HttpCode(200)
  @ApiOperation({ summary: 'Affecter / déplacer un matériel (tracé dans l’historique)' })
  affecter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AffecterMaterielDto,
    @UtilisateurCourant() user: UtilisateurConnecte,
  ) {
    return this.service.affecter(id, dto, user.id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un matériel saisi par erreur (préférer l’état REFORME)' })
  async supprimer(@Param('id', ParseIntPipe) id: number) {
    await this.service.supprimer(id);
  }
}
