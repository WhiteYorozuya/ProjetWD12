import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsIP, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreerPosteDto {
  @ApiProperty({ example: 'S201-P01' })
  @IsString()
  @MinLength(1)
  @MaxLength(63)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9-]*$/, { message: 'Nom d’hôte invalide (lettres, chiffres et tirets)' })
  hostname: string;

  @ApiProperty() @IsInt() salleId: number;
  @ApiPropertyOptional({ example: '10.20.1.11' }) @IsOptional() @IsIP() adresseIp?: string;
  @ApiPropertyOptional({ example: 'Windows 11 Entreprise' }) @IsOptional() @IsString() @MaxLength(100) systeme?: string;
}

export class ModifierPosteDto extends PartialType(CreerPosteDto) {}

export class DeclarerApplicationDto {
  @ApiProperty() @IsInt() applicationId: number;
  @ApiPropertyOptional({ example: '2.4.1' }) @IsOptional() @IsString() @MaxLength(40) version?: string;
}

export class FiltrePostesDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() salleId?: number;
}
