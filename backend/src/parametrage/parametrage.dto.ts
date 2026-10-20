import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class TypeMaterielDto {
  @ApiProperty({ example: 'UC' }) @IsString() @MinLength(1) @MaxLength(60) libelle: string;

  @ApiProperty({ example: 60, description: "Durée d'aptitude en mois" })
  @IsInt()
  @Min(1)
  @Max(360)
  dureeAptitudeMois: number;

  @ApiPropertyOptional({ type: [Number], description: 'Formations induites' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  formationIds?: number[];
}
export class ModifierTypeMaterielDto extends PartialType(TypeMaterielDto) {}

export class FormationDto {
  @ApiProperty({ example: 'Administration réseau niveau 1' }) @IsString() @MinLength(1) @MaxLength(120) intitule: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @ApiPropertyOptional({ example: 7 }) @IsOptional() @IsInt() @Min(1) @Max(1000) dureeHeures?: number;
}
export class ModifierFormationDto extends PartialType(FormationDto) {}

export class ApplicationDto {
  @ApiProperty({ example: 'SIRH Défense' }) @IsString() @MinLength(1) @MaxLength(120) nom: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) editeur?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() metier?: boolean;
}
export class ModifierApplicationDto extends PartialType(ApplicationDto) {}
