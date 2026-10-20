import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TypeSalle } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreerSalleDto {
  @ApiProperty({ example: '201' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[\w\-. ]+$/, { message: 'Le code ne doit contenir que lettres, chiffres, espaces, - _ .' })
  code: string;

  @ApiProperty({ example: 'Salle réseaux' }) @IsString() @MinLength(1) @MaxLength(100) nom: string;
  @ApiPropertyOptional({ example: 'Bâtiment B' }) @IsOptional() @IsString() @MaxLength(100) batiment?: string;
  @ApiPropertyOptional({ example: 16 }) @IsOptional() @IsInt() @Min(0) @Max(500) capacite?: number;
  @ApiPropertyOptional({ enum: TypeSalle }) @IsOptional() @IsEnum(TypeSalle) type?: TypeSalle;
}

export class ModifierSalleDto extends PartialType(CreerSalleDto) {}
