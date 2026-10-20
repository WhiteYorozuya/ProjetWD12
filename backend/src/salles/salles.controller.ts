import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators';
import { CreerSalleDto, ModifierSalleDto } from './salles.dto';
import { SallesService } from './salles.service';

@ApiTags('Salles')
@ApiBearerAuth()
@Controller('salles')
export class SallesController {
  constructor(private readonly service: SallesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les salles avec leurs compteurs' })
  lister() {
    return this.service.lister();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une salle : postes et matériels" })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Roles(Role.GESTIONNAIRE)
  @Post()
  creer(@Body() dto: CreerSalleDto) {
    return this.service.creer(dto);
  }

  @Roles(Role.GESTIONNAIRE)
  @Patch(':id')
  modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierSalleDto) {
    return this.service.modifier(id, dto);
  }

  @Roles(Role.GESTIONNAIRE)
  @Delete(':id')
  @HttpCode(204)
  async supprimer(@Param('id', ParseIntPipe) id: number) {
    await this.service.supprimer(id);
  }
}
