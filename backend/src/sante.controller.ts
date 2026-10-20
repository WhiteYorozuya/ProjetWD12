import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './common/decorators';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Santé')
@Public()
@SkipThrottle()
@Controller('sante')
export class SanteController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Vérifie que l'API et la base de données répondent" })
  async sante() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { statut: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ statut: 'base de données indisponible' });
    }
  }
}
