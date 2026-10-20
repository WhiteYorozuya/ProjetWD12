import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { hacherJeton } from '../common/utils/jeton';
import { RequeteAuthentifiee } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';

/** Authentifie l'agent d'un poste par l'en-tête X-Agent-Token. */
@Injectable()
export class AgentTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequeteAuthentifiee>();
    const jeton = req.headers['x-agent-token'];
    if (typeof jeton !== 'string' || jeton.length < 10 || jeton.length > 200) {
      throw new UnauthorizedException('Jeton agent manquant');
    }
    const poste = await this.prisma.poste.findUnique({
      where: { agentTokenHash: hacherJeton(jeton) },
      select: { id: true, hostname: true, salleId: true },
    });
    if (!poste) throw new UnauthorizedException('Jeton agent invalide');
    req.poste = poste;
    return true;
  }
}
