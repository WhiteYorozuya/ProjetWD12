import { Injectable } from '@nestjs/common';
import { Prisma, StatutReinstallation, StatutRemontee } from '@prisma/client';
import { limiteHorsLigne } from '../common/utils/statut-poste';
import { MaterielsService } from '../materiels/materiels.service';
import { PrismaService } from '../prisma/prisma.service';

/** Secondes (bigint SQL) → heures arrondies au centième. */
export function enHeures(secondes: bigint | number | null): number {
  return Math.round(Number(secondes ?? 0) / 36) / 100;
}

function debutPeriode(jours: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (jours - 1));
  return d;
}

@Injectable()
export class StatistiquesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly materiels: MaterielsService,
  ) {}

  async tableauDeBord() {
    const [
      totalMateriels,
      parEtat,
      parTypeBrut,
      types,
      aptitudesExpirees,
      aptitudesProches,
      totalPostes,
      postesEnLigne,
      remonteesOuvertes,
      remonteesEnCours,
      alertesActives,
      reinstallationsActives,
      dernieresAlertes,
      dernieresRemontees,
      topProcessus,
    ] = await Promise.all([
      this.prisma.materiel.count(),
      this.prisma.materiel.groupBy({ by: ['etat'], _count: { _all: true } }),
      this.prisma.materiel.groupBy({ by: ['typeId'], _count: { _all: true } }),
      this.prisma.typeMateriel.findMany({ select: { id: true, libelle: true } }),
      this.materiels.rechercher({ aptitude: 'EXPIREE', page: 1, taille: 1 }).then((r) => r.total),
      this.materiels.rechercher({ aptitude: 'ECHEANCE_PROCHE', page: 1, taille: 1 }).then((r) => r.total),
      this.prisma.poste.count(),
      this.prisma.poste.count({ where: { derniereConnexion: { gte: limiteHorsLigne() } } }),
      this.prisma.remontee.count({ where: { statut: StatutRemontee.OUVERTE } }),
      this.prisma.remontee.count({ where: { statut: StatutRemontee.EN_COURS } }),
      this.prisma.alerte.count({ where: { acquittee: false } }),
      this.prisma.reinstallation.count({
        where: { statut: { in: [StatutReinstallation.DEMANDEE, StatutReinstallation.EN_COURS] } },
      }),
      this.prisma.alerte.findMany({
        where: { acquittee: false },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { poste: { select: { id: true, hostname: true } } },
      }),
      this.prisma.remontee.findMany({
        where: { statut: { not: StatutRemontee.RESOLUE } },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { salle: { select: { code: true } }, poste: { select: { hostname: true } } },
      }),
      this.topProcessus(7, undefined, 8),
    ]);

    const libelles = new Map(types.map((t) => [t.id, t.libelle]));
    return {
      materiels: {
        total: totalMateriels,
        parEtat: Object.fromEntries(parEtat.map((e) => [e.etat, e._count._all])),
        parType: parTypeBrut
          .map((t) => ({ type: libelles.get(t.typeId) ?? '?', nombre: t._count._all }))
          .sort((a, b) => b.nombre - a.nombre),
        aptitudesExpirees,
        aptitudesProches,
      },
      postes: { total: totalPostes, enLigne: postesEnLigne },
      remontees: { ouvertes: remonteesOuvertes, enCours: remonteesEnCours },
      alertesActives,
      reinstallationsActives,
      dernieresAlertes,
      dernieresRemontees,
      topProcessus,
    };
  }

  /** Processus les plus utilisés (temps cumulé) sur la période. */
  async topProcessus(jours: number, salleId?: number, limite = 15) {
    const filtreSalle = salleId ? Prisma.sql`AND p."salleId" = ${salleId}` : Prisma.empty;
    const lignes = await this.prisma.$queryRaw<{ nom: string; secondes: bigint; postes: bigint }[]>`
      SELECT s.nom, SUM(s.secondes) AS secondes, COUNT(DISTINCT s."posteId") AS postes
      FROM stats_processus s
      JOIN postes p ON p.id = s."posteId"
      WHERE s.jour >= ${debutPeriode(jours)}::date ${filtreSalle}
      GROUP BY s.nom
      ORDER BY secondes DESC
      LIMIT ${limite}`;
    return lignes.map((l) => ({ nom: l.nom, heures: enHeures(l.secondes), postes: Number(l.postes) }));
  }

  /** Utilisation des salles : heures de session ouverte, CPU moyen, postes actifs. */
  async occupationSalles(jours: number) {
    const lignes = await this.prisma.$queryRaw<
      { salleId: number; code: string; nom: string; nbPostes: bigint; secondesSession: bigint | null; cpuMoyen: number | null; postesActifs: bigint }[]
    >`
      SELECT sa.id AS "salleId", sa.code, sa.nom,
        (SELECT COUNT(*) FROM postes px WHERE px."salleId" = sa.id) AS "nbPostes",
        SUM(e."dureeSecondes") FILTER (WHERE e."sessionOuverte") AS "secondesSession",
        AVG(e.cpu) AS "cpuMoyen",
        COUNT(DISTINCT e."posteId") AS "postesActifs"
      FROM salles sa
      LEFT JOIN postes p ON p."salleId" = sa.id
      LEFT JOIN echantillons_usage e ON e."posteId" = p.id AND e.horodatage >= ${debutPeriode(jours)}
      WHERE sa.type <> 'MAGASIN'
      GROUP BY sa.id, sa.code, sa.nom
      ORDER BY sa.code`;
    return lignes.map((l) => ({
      salleId: l.salleId,
      code: l.code,
      nom: l.nom,
      nbPostes: Number(l.nbPostes),
      postesActifs: Number(l.postesActifs),
      heuresUtilisation: enHeures(l.secondesSession),
      cpuMoyen: l.cpuMoyen === null ? null : Math.round(l.cpuMoyen * 10) / 10,
    }));
  }

  /** Activité jour par jour : postes vus en ligne et heures d'utilisation. */
  async activiteQuotidienne(jours: number) {
    const lignes = await this.prisma.$queryRaw<{ jour: Date; postes: bigint; secondesSession: bigint | null }[]>`
      SELECT date_trunc('day', horodatage)::date AS jour,
        COUNT(DISTINCT "posteId") AS postes,
        SUM("dureeSecondes") FILTER (WHERE "sessionOuverte") AS "secondesSession"
      FROM echantillons_usage
      WHERE horodatage >= ${debutPeriode(jours)}
      GROUP BY 1
      ORDER BY 1`;
    const parJour = new Map(lignes.map((l) => [l.jour.toISOString().slice(0, 10), l]));
    // Complète les jours sans activité pour un graphique continu
    const resultat = [];
    for (let i = 0; i < jours; i++) {
      const d = debutPeriode(jours);
      d.setUTCDate(d.getUTCDate() + i);
      const cle = d.toISOString().slice(0, 10);
      const l = parJour.get(cle);
      resultat.push({
        jour: cle,
        postesActifs: l ? Number(l.postes) : 0,
        heuresUtilisation: l ? enHeures(l.secondesSession) : 0,
      });
    }
    return resultat;
  }
}
