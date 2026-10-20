import { BadRequestException } from '@nestjs/common';
import { EtatMateriel, TypeSalle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { etatApresDeplacement, lireDate, lireEtat, MaterielsService } from './materiels.service';

describe('MaterielsService — fonctions de conversion', () => {
  it("lit l'état sous plusieurs formes", () => {
    expect(lireEtat('EN_STOCK')).toBe(EtatMateriel.EN_STOCK);
    expect(lireEtat('en service')).toBe(EtatMateriel.EN_SERVICE);
    expect(lireEtat('En-réparation')).toBe(EtatMateriel.EN_REPARATION);
    expect(lireEtat('Réformé')).toBe(EtatMateriel.REFORME);
    expect(lireEtat('cassé')).toBeNull();
  });

  it('lit les dates françaises et ISO, rejette les dates impossibles', () => {
    expect(lireDate('28/09/2026')).toEqual(new Date(Date.UTC(2026, 8, 28)));
    expect(lireDate('2026-09-28')).toEqual(new Date(Date.UTC(2026, 8, 28)));
    expect(lireDate('31/02/2026')).toBeNull();
    expect(lireDate('demain')).toBeNull();
  });

  it("met à jour l'état logique lors d'un déplacement", () => {
    expect(etatApresDeplacement(EtatMateriel.EN_STOCK, false)).toBe(EtatMateriel.EN_SERVICE);
    expect(etatApresDeplacement(EtatMateriel.EN_SERVICE, true)).toBe(EtatMateriel.EN_STOCK);
    expect(etatApresDeplacement(EtatMateriel.EN_PANNE, true)).toBe(EtatMateriel.EN_PANNE);
  });
});

describe('MaterielsService — import CSV', () => {
  const magasin = { id: 1, code: 'MAG', nom: 'Magasin', type: TypeSalle.MAGASIN };
  const s201 = { id: 2, code: '201', nom: 'Réseaux', type: TypeSalle.TECHNIQUE };

  function service(existants: string[] = []) {
    const prisma = {
      typeMateriel: { findMany: jest.fn().mockResolvedValue([{ id: 10, libelle: 'UC', dureeAptitudeMois: 60 }]) },
      salle: {
        findMany: jest.fn().mockResolvedValue([magasin, s201]),
        findFirst: jest.fn().mockResolvedValue(magasin),
      },
      materiel: {
        findMany: jest.fn().mockResolvedValue(existants.map((numeroSerie) => ({ numeroSerie }))),
      },
      $transaction: jest.fn(),
    };
    return { svc: new MaterielsService(prisma as unknown as PrismaService), prisma };
  }

  it('valide un fichier correct en mode simulation sans rien écrire', async () => {
    const { svc, prisma } = service();
    const csv = 'numeroSerie;type;marque;modele;salle;etat;dateReception\nabc1;UC;HP;G9;201;;28/09/2026\nABC2;uc;HP;G9;;;\n';
    const bilan = await svc.importer({ csv, simulation: true }, 1);
    expect(bilan).toEqual({ total: 2, valides: 2, erreurs: [], importes: 0 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('signale chaque erreur avec son numéro de ligne et n’importe rien (tout ou rien)', async () => {
    const { svc, prisma } = service(['EXISTANT']);
    const csv = [
      'numeroSerie;type;marque;modele;salle;etat;dateReception',
      'existant;UC;HP;G9;;;',
      'NEW1;Tablette;HP;G9;;;',
      'NEW2;UC;HP;G9;999;cassé;31/02/2026',
      'NEW3;UC;HP;G9;;;',
      'NEW3;UC;HP;G9;;;',
    ].join('\n');
    const bilan = await svc.importer({ csv }, 1);
    expect(bilan.valides).toBe(1);
    expect(bilan.importes).toBe(0);
    expect(bilan.erreurs.map((e) => e.ligne)).toEqual([2, 3, 4, 6]);
    expect(bilan.erreurs[0].message).toContain('déjà inventorié');
    expect(bilan.erreurs[1].message).toContain('type « Tablette » inconnu');
    expect(bilan.erreurs[2].message).toMatch(/salle « 999 » inconnue.*état « cassé ».*date/);
    expect(bilan.erreurs[3].message).toContain('en double');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuse un fichier sans les colonnes obligatoires', async () => {
    const { svc } = service();
    await expect(svc.importer({ csv: 'serie;marque\nA;B' }, 1)).rejects.toThrow(BadRequestException);
  });
});
