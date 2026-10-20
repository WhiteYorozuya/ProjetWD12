import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EtatMateriel, NiveauAlerte, TypeAlerte } from '@prisma/client';
import { calculerFinAptitude } from '../common/utils/aptitude';
import { limiteHorsLigne } from '../common/utils/statut-poste';
import { PrismaService } from '../prisma/prisma.service';
import { AlertesService } from './alertes.service';

const RETENTION_ECHANTILLONS_JOURS = 30;
const RETENTION_STATS_JOURS = 365;

/** Tâches planifiées : détection des postes hors ligne, aptitudes échues, purge. */
@Injectable()
export class TachesService {
  private readonly logger = new Logger(TachesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertes: AlertesService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async detecterPostesHorsLigne() {
    const postes = await this.prisma.poste.findMany({
      where: { derniereConnexion: { lt: limiteHorsLigne(), not: null } },
      select: { id: true, hostname: true, salleId: true, derniereConnexion: true },
    });
    for (const p of postes) {
      // Une alerte par « déconnexion » : on ignore si une alerte a déjà été émise depuis la dernière connexion
      const dejaSignale = await this.prisma.alerte.count({
        where: { type: TypeAlerte.POSTE_HORS_LIGNE, posteId: p.id, createdAt: { gte: p.derniereConnexion! } },
      });
      if (dejaSignale) continue;
      await this.alertes.creerSiAbsente({
        type: TypeAlerte.POSTE_HORS_LIGNE,
        niveau: NiveauAlerte.AVERTISSEMENT,
        message: `Le poste ${p.hostname} ne répond plus`,
        posteId: p.id,
        salleId: p.salleId,
      });
    }
    // Les processus d'un poste hors ligne ne sont plus significatifs
    if (postes.length) {
      await this.prisma.processusActif.deleteMany({ where: { posteId: { in: postes.map((p) => p.id) } } });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async verifierAptitudes() {
    const materiels = await this.prisma.materiel.findMany({
      where: { etat: { not: EtatMateriel.REFORME } },
      include: { type: true },
    });
    let creees = 0;
    const maintenant = new Date();
    for (const m of materiels) {
      const fin = calculerFinAptitude(m.dateReception, m.type.dureeAptitudeMois);
      if (fin > maintenant) continue;
      const creee = await this.alertes.creerSiAbsente({
        type: TypeAlerte.APTITUDE_EXPIREE,
        niveau: NiveauAlerte.INFO,
        message: `${m.type.libelle} ${m.numeroSerie} : aptitude échue le ${fin.toLocaleDateString('fr-FR')} — à réformer`,
        materielId: m.id,
        salleId: m.salleId,
      });
      if (creee) creees++;
    }
    if (creees) this.logger.log(`${creees} alerte(s) d'aptitude créée(s)`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purger() {
    const jour = 24 * 3600 * 1000;
    const { count } = await this.prisma.echantillonUsage.deleteMany({
      where: { horodatage: { lt: new Date(Date.now() - RETENTION_ECHANTILLONS_JOURS * jour) } },
    });
    await this.prisma.statProcessus.deleteMany({
      where: { jour: { lt: new Date(Date.now() - RETENTION_STATS_JOURS * jour) } },
    });
    this.logger.log(`Purge : ${count} échantillon(s) supprimé(s)`);
  }
}
