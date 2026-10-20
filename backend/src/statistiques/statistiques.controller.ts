import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { StatistiquesService } from './statistiques.service';

export class PeriodeDto {
  @ApiPropertyOptional({ default: 7, minimum: 1, maximum: 90 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  jours: number = 7;

  @ApiPropertyOptional() @IsOptional() @IsInt() salleId?: number;
}

@ApiTags('Tableau de bord & statistiques')
@ApiBearerAuth()
@Controller()
export class StatistiquesController {
  constructor(private readonly service: StatistiquesService) {}

  @Get('tableau-de-bord')
  @ApiOperation({ summary: 'Indicateurs clés du parc' })
  tableauDeBord() {
    return this.service.tableauDeBord();
  }

  @Get('statistiques/processus')
  @ApiOperation({ summary: 'Processus les plus utilisés (heures cumulées)' })
  processus(@Query() p: PeriodeDto) {
    return this.service.topProcessus(p.jours, p.salleId);
  }

  @Get('statistiques/salles')
  @ApiOperation({ summary: "Taux d'utilisation des salles" })
  salles(@Query() p: PeriodeDto) {
    return this.service.occupationSalles(p.jours);
  }

  @Get('statistiques/activite')
  @ApiOperation({ summary: 'Activité quotidienne du parc' })
  activite(@Query() p: PeriodeDto) {
    return this.service.activiteQuotidienne(p.jours);
  }
}
