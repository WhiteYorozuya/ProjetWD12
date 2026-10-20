import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutReinstallation } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DemanderReinstallationDto {
  @ApiPropertyOptional({ example: 'Master Windows 11 — stage réseaux', default: 'Master standard' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  image?: string;
}

export class FiltreReinstallationsDto {
  @ApiPropertyOptional({ enum: StatutReinstallation }) @IsOptional() @IsEnum(StatutReinstallation) statut?: StatutReinstallation;
  @ApiPropertyOptional() @IsOptional() @IsInt() salleId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) lot?: string;
}
