import { dureeImputable, INTERVALLE_HEARTBEAT_SECONDES } from './agent.service';

describe('Agent — durée imputée aux statistiques', () => {
  const maintenant = new Date('2026-10-20T10:00:00Z');

  it("compte l'intervalle nominal au premier heartbeat", () => {
    expect(dureeImputable(null, maintenant)).toBe(INTERVALLE_HEARTBEAT_SECONDES);
  });

  it("compte l'écart réel entre deux heartbeats", () => {
    expect(dureeImputable(new Date('2026-10-20T09:59:48Z'), maintenant)).toBe(12);
  });

  it("plafonne l'écart après une coupure (le poste était éteint)", () => {
    expect(dureeImputable(new Date('2026-10-19T18:00:00Z'), maintenant)).toBe(INTERVALLE_HEARTBEAT_SECONDES * 3);
  });

  it('ignore une horloge incohérente', () => {
    expect(dureeImputable(new Date('2026-10-20T10:00:05Z'), maintenant)).toBe(0);
  });
});
