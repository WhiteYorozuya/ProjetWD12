import { describe, expect, it } from 'vitest';
import { aLeDroit } from './droits';

describe('droits', () => {
  it("donne tous les droits à l'administrateur", () => {
    expect(aLeDroit('ADMIN', 'gererUtilisateurs')).toBe(true);
    expect(aLeDroit('ADMIN', 'gererMateriel')).toBe(true);
  });

  it('restreint chaque rôle à son périmètre', () => {
    expect(aLeDroit('GESTIONNAIRE', 'gererMateriel')).toBe(true);
    expect(aLeDroit('GESTIONNAIRE', 'tuerProcessus')).toBe(false);
    expect(aLeDroit('FORMATEUR', 'tuerProcessus')).toBe(true);
    expect(aLeDroit('FORMATEUR', 'gererMateriel')).toBe(false);
    expect(aLeDroit('ADMIN_SALLE', 'gererUtilisateurs')).toBe(false);
  });

  it("refuse tout à un visiteur non connecté", () => {
    expect(aLeDroit(undefined, 'superviser')).toBe(false);
  });
});
