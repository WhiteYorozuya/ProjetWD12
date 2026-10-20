import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AgentModule } from './agent/agent.module';
import { AlertesModule } from './alertes/alertes.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { validerConfiguration } from './config/configuration';
import { DocumentsModule } from './documents/documents.module';
import { MaterielsModule } from './materiels/materiels.module';
import { ParametrageModule } from './parametrage/parametrage.module';
import { PostesModule } from './postes/postes.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReinstallationsModule } from './reinstallations/reinstallations.module';
import { RemonteesModule } from './remontees/remontees.module';
import { SallesModule } from './salles/salles.module';
import { SanteController } from './sante.controller';
import { StatistiquesModule } from './statistiques/statistiques.module';
import { SupervisionModule } from './supervision/supervision.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validerConfiguration }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 600 }]),
    PrismaModule,
    AuthModule,
    UtilisateursModule,
    SallesModule,
    MaterielsModule,
    ParametrageModule,
    PostesModule,
    ReinstallationsModule,
    RemonteesModule,
    SupervisionModule,
    AlertesModule,
    AgentModule,
    StatistiquesModule,
    DocumentsModule,
  ],
  controllers: [SanteController],
  providers: [
    // L'ordre compte : limitation de débit, puis authentification, puis contrôle des rôles.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
