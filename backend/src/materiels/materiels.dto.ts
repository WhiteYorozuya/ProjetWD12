import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { EtatMateriel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../common/dto/pagination.dto';

export class CreerMaterielDto {
  @ApiProperty({ example: 'CZC1234XYZ' }) @IsString() @MinLength(2) @MaxLength(60) numeroSerie: string;
  @ApiProperty({ example: 1 }) @IsInt() typeId: number;
  @ApiProperty({ example: 'HP' }) @IsString() @MinLength(1) @MaxLength(60) marque: string;
  @ApiProperty({ example: 'EliteDesk 800 G6' }) @IsString() @MinLength(1) @MaxLength(100) modele: string;
  @ApiPropertyOptional({ enum: EtatMateriel }) @IsOptional() @IsEnum(EtatMateriel) etat?: EtatMateriel;
  @ApiPropertyOptional({ type: String, format: 'date' }) @IsOptional() @Type(() => Date) @IsDate() dateReception?: Date;
  @ApiPropertyOptional({ example: 'CND' }) @IsOptional() @IsString() @MaxLength(60) origine?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() salleId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() posteId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) commentaire?: string;
}

/** La localisation se modifie uniquement via /affectation (pour tracer le mouvement). */
export class ModifierMaterielDto extends PartialType(OmitType(CreerMaterielDto, ['salleId', 'posteId'] as const)) {}

export class AffecterMaterielDto {
  @ApiPropertyOptional({ description: 'Salle de destination (null = retour au magasin par défaut)' })
  @IsOptional()
  @IsInt()
  salleId?: number;

  @ApiPropertyOptional({ description: 'Poste de destination (doit appartenir à la salle)' })
  @IsOptional()
  @IsInt()
  posteId?: number;

  @ApiPropertyOptional({ example: 'Préparation du stage CDU 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motif?: string;
}

export class AffectationGroupeeDto extends AffecterMaterielDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  ids: number[];
}

export const FILTRES_APTITUDE = ['EXPIREE', 'ECHEANCE_PROCHE'] as const;

export class RechercheMaterielDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'N° de série, marque ou modèle' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recherche?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() typeId?: number;
  @ApiPropertyOptional({ enum: EtatMateriel }) @IsOptional() @IsEnum(EtatMateriel) etat?: EtatMateriel;
  @ApiPropertyOptional() @IsOptional() @IsInt() salleId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() posteId?: number;
  @ApiPropertyOptional({ enum: FILTRES_APTITUDE }) @IsOptional() @IsIn(FILTRES_APTITUDE) aptitude?: (typeof FILTRES_APTITUDE)[number];
}

export class ImportMaterielsDto {
  @ApiProperty({
    description: 'Contenu CSV. Colonnes : numeroSerie;type;marque;modele;salle;etat;dateReception',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1_000_000)
  csv: string;

  @ApiPropertyOptional({ description: "true = vérifie seulement, n'enregistre rien", default: false })
  @IsOptional()
  @IsBoolean()
  simulation?: boolean;
}
