import { Injectable } from '@nestjs/common';
import { NiveauAlerte, Prisma, TypeAlerte } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NouvelleAlerte {
  type: TypeAlerte;
  niveau: NiveauAlerte;
  message: string;
  salleId?: number | null;
  posteId?: number | null;
  materielId?: number | null;
}

/** Fenêtre pendant laquelle une alerte identique non acquittée n'est pas recréée. */
const FENETRE_DEDOUBLONNAGE_MIN: Record<TypeAlerte, number | null> = {
  PROCESSUS_INTERDIT: 10,
  CPU_ELEVE: 30,
  POSTE_HORS_LIGNE: null, // une seule tant qu'elle n'est pas acquittée
  APTITUDE_EXPIREE: null,
};

@Injectable()
export class AlertesService {
  constructor(private readonly prisma: PrismaService) {}

  lister(acquittee?: boolean, type?: TypeAlerte) {
    return this.prisma.alerte.findMany({
      where: { acquittee, type },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        salle: { select: { id: true, code: true, nom: true } },
        poste: { select: { id: true, hostname: true } },
        materiel: { select: { id: true, numeroSerie: true } },
        acquitteePar: { select: { nom: true, prenom: true } },
      },
    });
  }

  acquitter(id: number, utilisateurId: number) {
    return this.prisma.alerte.update({
      where: { id },
      data: { acquittee: true, acquitteeParId: utilisateurId, acquitteeLe: new Date() },
    });
  }

  async acquitterTout(utilisateurId: number) {
    const { count } = await this.prisma.alerte.updateMany({
      where: { acquittee: false },
      data: { acquittee: true, acquitteeParId: utilisateurId, acquitteeLe: new Date() },
    });
    return { acquittees: count };
  }

  /** Crée l'alerte sauf si une alerte équivalente non acquittée existe déjà. Renvoie true si créée. */
  async creerSiAbsente(alerte: NouvelleAlerte, client: Prisma.TransactionClient = this.prisma): Promise<boolean> {
    const fenetre = FENETRE_DEDOUBLONNAGE_MIN[alerte.type];
    const existante = await client.alerte.findFirst({
      where: {
        type: alerte.type,
        acquittee: false,
        posteId: alerte.posteId ?? null,
        materielId: alerte.materielId ?? null,
        ...(alerte.type === TypeAlerte.PROCESSUS_INTERDIT ? { message: alerte.message } : {}),
        ...(fenetre ? { createdAt: { gte: new Date(Date.now() - fenetre * 60_000) } } : {}),
      },
      select: { id: true },
    });
    if (existante) return false;
    await client.alerte.create({ data: alerte });
    return true;
  }
}
