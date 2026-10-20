import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators';
import {
  ApplicationDto,
  FormationDto,
  ModifierApplicationDto,
  ModifierFormationDto,
  ModifierTypeMaterielDto,
  TypeMaterielDto,
} from './parametrage.dto';
import { ParametrageService } from './parametrage.service';

@ApiTags('Paramétrage')
@ApiBearerAuth()
@Controller('types-materiel')
export class TypesMaterielController {
  constructor(private readonly service: ParametrageService) {}

  @Get()
  @ApiOperation({ summary: "Types de matériel, durées d'aptitude et formations induites" })
  lister() {
    return this.service.listerTypes();
  }

  @Roles(Role.GESTIONNAIRE)
  @Post()
  creer(@Body() dto: TypeMaterielDto) {
    return this.service.creerType(dto);
  }

  @Roles(Role.GESTIONNAIRE)
  @Patch(':id')
  modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierTypeMaterielDto) {
    return this.service.modifierType(id, dto);
  }

  @Roles(Role.GESTIONNAIRE)
  @Delete(':id')
  @HttpCode(204)
  async supprimer(@Param('id', ParseIntPipe) id: number) {
    await this.service.supprimerType(id);
  }
}

@ApiTags('Paramétrage')
@ApiBearerAuth()
@Controller('formations')
export class FormationsController {
  constructor(private readonly service: ParametrageService) {}

  @Get()
  lister() {
    return this.service.listerFormations();
  }

  @Roles(Role.GESTIONNAIRE)
  @Post()
  creer(@Body() dto: FormationDto) {
    return this.service.creerFormation(dto);
  }

  @Roles(Role.GESTIONNAIRE)
  @Patch(':id')
  modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierFormationDto) {
    return this.service.modifierFormation(id, dto);
  }

  @Roles(Role.GESTIONNAIRE)
  @Delete(':id')
  @HttpCode(204)
  async supprimer(@Param('id', ParseIntPipe) id: number) {
    await this.service.supprimerFormation(id);
  }
}

@ApiTags('Paramétrage')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ParametrageService) {}

  @Get()
  @ApiOperation({ summary: 'Catalogue des applications (métier et détectées)' })
  lister() {
    return this.service.listerApplications();
  }

  @Roles(Role.ADMIN_SALLE, Role.GESTIONNAIRE)
  @Post()
  creer(@Body() dto: ApplicationDto) {
    return this.service.creerApplication(dto);
  }

  @Roles(Role.ADMIN_SALLE, Role.GESTIONNAIRE)
  @Patch(':id')
  modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierApplicationDto) {
    return this.service.modifierApplication(id, dto);
  }

  @Roles(Role.ADMIN_SALLE, Role.GESTIONNAIRE)
  @Delete(':id')
  @HttpCode(204)
  async supprimer(@Param('id', ParseIntPipe) id: number) {
    await this.service.supprimerApplication(id);
  }
}
