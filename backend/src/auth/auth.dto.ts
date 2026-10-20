import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@aster.local' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'Admin#2026!' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  motDePasse: string;
}

export class ChangerMotDePasseDto {
  @ApiProperty()
  @IsString()
  @MaxLength(128)
  ancien: string;

  @ApiProperty({ description: '12 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  nouveau: string;
}
