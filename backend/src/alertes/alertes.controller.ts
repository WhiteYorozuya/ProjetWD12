import { Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Role, TypeAlerte } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Roles, UtilisateurCourant } from '../common/decorators';
import { UtilisateurConnecte } from '../common/types';
import { AlertesService } from './alertes.service';

export class FiltreAlertesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ obj }) => (obj.acquittee === undefined ? undefined : obj.acquittee === true || obj.acquittee === 'true'))
  @IsBoolean()
  acquittee?: boolean;

  @ApiPropertyOptional({ enum: TypeAlerte }) @IsOptional() @IsEnum(TypeAlerte) type?: TypeAlerte;
}

@ApiTags('Alertes')
@ApiBearerAuth()
@Controller('alertes')
export class AlertesController {
  constructor(private readonly service: AlertesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les alertes' })
  lister(@Query() filtre: FiltreAlertesDto) {
    return this.service.lister(filtre.acquittee, filtre.type);
  }

  @Roles(Role.ADMIN_SALLE, Role.GESTIONNAIRE)
  @Post('acquitter-tout')
  @HttpCode(200)
  acquitterTout(@UtilisateurCourant() user: UtilisateurConnecte) {
    return this.service.acquitterTout(user.id);
  }

  @Roles(Role.ADMIN_SALLE, Role.GESTIONNAIRE)
  @Post(':id/acquitter')
  @HttpCode(200)
  acquitter(@Param('id', ParseIntPipe) id: number, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.service.acquitter(id, user.id);
  }
}
