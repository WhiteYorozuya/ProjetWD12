import { Controller, Get, Param, ParseIntPipe, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FastifyReply } from 'fastify';
import { Roles, UtilisateurCourant } from '../common/decorators';
import { UtilisateurConnecte } from '../common/types';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@ApiBearerAuth()
@Roles(Role.GESTIONNAIRE, Role.ADMIN_SALLE)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  private envoyer(reply: FastifyReply, fichier: { nomFichier: string; contenu: Buffer }) {
    void reply.header('Content-Type', 'application/pdf');
    void reply.header('Content-Disposition', `attachment; filename="${fichier.nomFichier}"`);
    return new StreamableFile(fichier.contenu);
  }

  @Get('etat-des-lieux/salles/:salleId')
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: "État des lieux PDF d'une salle" })
  async etatDesLieux(
    @Param('salleId', ParseIntPipe) salleId: number,
    @UtilisateurCourant() user: UtilisateurConnecte,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    return this.envoyer(reply, await this.service.etatDesLieuxSalle(salleId, `${user.prenom} ${user.nom}`));
  }

  @Get('inventaire')
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Inventaire général PDF' })
  async inventaire(@UtilisateurCourant() user: UtilisateurConnecte, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.envoyer(reply, await this.service.inventaireGeneral(`${user.prenom} ${user.nom}`));
  }
}
