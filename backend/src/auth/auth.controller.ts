import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public, UtilisateurCourant } from '../common/decorators';
import { UtilisateurConnecte } from '../common/types';
import { ChangerMotDePasseDto, LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // limite le brute-force
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Connexion — renvoie un jeton JWT' })
  login(@Body() dto: LoginDto) {
    return this.auth.connecter(dto.email, dto.motDePasse);
  }

  @ApiBearerAuth()
  @Get('moi')
  @ApiOperation({ summary: "Profil de l'utilisateur connecté" })
  moi(@UtilisateurCourant() user: UtilisateurConnecte) {
    return user;
  }

  @ApiBearerAuth()
  @Post('mot-de-passe')
  @HttpCode(204)
  @ApiOperation({ summary: 'Changer son mot de passe' })
  async changerMotDePasse(@UtilisateurCourant() user: UtilisateurConnecte, @Body() dto: ChangerMotDePasseDto) {
    await this.auth.changerMotDePasse(user.id, dto.ancien, dto.nouveau);
  }
}
