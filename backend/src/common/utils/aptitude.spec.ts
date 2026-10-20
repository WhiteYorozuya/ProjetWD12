import { calculerFinAptitude, statutAptitude } from './aptitude';

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe("Durée d'aptitude", () => {
  it('ajoute la durée en mois à la date de réception', () => {
    expect(calculerFinAptitude(d('2024-03-15'), 60)).toEqual(d('2029-03-15'));
  });

  it('gère les fins de mois', () => {
    expect(calculerFinAptitude(d('2024-01-31'), 1)).toEqual(d('2024-02-29'));
    expect(calculerFinAptitude(d('2023-01-31'), 1)).toEqual(d('2023-02-28'));
  });

  it('accepte une durée négative (calcul inverse utilisé pour les filtres)', () => {
    expect(calculerFinAptitude(d('2026-10-20'), -60)).toEqual(d('2021-10-20'));
  });

  it("donne le statut d'aptitude", () => {
    const maintenant = d('2026-10-20');
    expect(statutAptitude(d('2026-10-19'), maintenant)).toBe('EXPIREE');
    expect(statutAptitude(d('2026-12-01'), maintenant)).toBe('ECHEANCE_PROCHE');
    expect(statutAptitude(d('2027-06-01'), maintenant)).toBe('APTE');
  });
});
