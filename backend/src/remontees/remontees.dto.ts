import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priorite, StatutRemontee, TypeRemontee } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreerRemonteeDto {
  @ApiProperty({ enum: TypeRemontee }) @IsEnum(TypeRemontee) type: TypeRemontee;
  @ApiPropertyOptional({ enum: Priorite }) @IsOptional() @IsEnum(Priorite) priorite?: Priorite;
  @ApiProperty({ example: "L'écran du poste 3 clignote" }) @IsString() @MinLength(3) @MaxLength(150) titre: string;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(3000) description: string;
  @ApiPropertyOptional({ description: 'Obligatoire si aucun poste n’est indiqué' }) @IsOptional() @IsInt() salleId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() posteId?: number;
}

export class TraiterRemonteeDto {
  @ApiProperty({ enum: StatutRemontee }) @IsEnum(StatutRemontee) statut: StatutRemontee;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(3000) reponse?: string;
}

export class FiltreRemonteesDto {
  @ApiPropertyOptional({ enum: StatutRemontee }) @IsOptional() @IsEnum(StatutRemontee) statut?: StatutRemontee;
  @ApiPropertyOptional({ enum: TypeRemontee }) @IsOptional() @IsEnum(TypeRemontee) type?: TypeRemontee;
  @ApiPropertyOptional() @IsOptional() @IsInt() salleId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() posteId?: number;
  @ApiPropertyOptional({ description: 'Uniquement mes remontées' })
  @IsOptional()
  @Transform(({ obj }) => obj.miennes === true || obj.miennes === 'true') // « false » ne doit pas devenir true
  @IsBoolean()
  miennes?: boolean;
}
