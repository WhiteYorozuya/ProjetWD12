import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeRegle } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreerRegleDto {
  @ApiProperty({ example: 'steam.exe' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/^[^\\/:*?"<>|]+$/, { message: "Nom d'exécutable invalide" })
  nom: string;

  @ApiProperty({ enum: TypeRegle }) @IsEnum(TypeRegle) type: TypeRegle;
  @ApiPropertyOptional({ description: 'Vide = règle globale' }) @IsOptional() @IsInt() salleId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) motif?: string;
}

export class FiltreReglesDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() salleId?: number;
}
