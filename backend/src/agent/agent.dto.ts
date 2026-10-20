import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsIP,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProcessusRemonteDto {
  @ApiProperty() @IsInt() @Min(0) pid: number;
  @ApiProperty({ example: 'chrome.exe' }) @IsString() @MinLength(1) @MaxLength(120) nom: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) utilisateur?: string;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) cpu: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(1_000_000) memoireMo: number;
}

export class ApplicationRemonteeDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120) nom: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) version?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) editeur?: string;
}

export class HeartbeatDto {
  @ApiProperty() @IsNumber() @Min(0) @Max(100) cpu: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) ram: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) utilisateur?: string;
  @ApiPropertyOptional() @IsOptional() @IsIP() adresseIp?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) systeme?: string;

  @ApiProperty({ type: [ProcessusRemonteDto] })
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => ProcessusRemonteDto)
  processus: ProcessusRemonteDto[];

  @ApiPropertyOptional({ type: [ApplicationRemonteeDto], description: 'Envoyé seulement si la liste a changé' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ApplicationRemonteeDto)
  applications?: ApplicationRemonteeDto[];
}

export const STATUTS_RESULTAT = ['EN_COURS', 'EXECUTEE', 'ECHEC'] as const;

export class ResultatCommandeDto {
  @ApiProperty({ enum: STATUTS_RESULTAT }) @IsIn(STATUTS_RESULTAT) statut: (typeof STATUTS_RESULTAT)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) message?: string;
}
