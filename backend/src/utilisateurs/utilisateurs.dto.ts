import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreerUtilisateurDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80) nom: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80) prenom: string;
  @ApiProperty({ enum: Role }) @IsEnum(Role) role: Role;
  @ApiProperty({ description: '12 caractères, 4 classes de caractères' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  motDePasse: string;
}

export class ModifierUtilisateurDto extends PartialType(OmitType(CreerUtilisateurDto, ['motDePasse', 'email'] as const)) {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() actif?: boolean;
}

export class ReinitialiserMotDePasseDto {
  @ApiProperty() @IsString() @MinLength(12) @MaxLength(128) motDePasse: string;
}
