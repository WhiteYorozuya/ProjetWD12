import { hacherMotDePasse, motDePasseRobuste, verifierMotDePasse } from './mot-de-passe';

describe('Mots de passe', () => {
  it('impose 12 caractères et 4 classes', () => {
    expect(motDePasseRobuste('AsterDemo#2026')).toBe(true);
    expect(motDePasseRobuste('Court#1a')).toBe(false);
    expect(motDePasseRobuste('sansmajuscule#2026')).toBe(false);
    expect(motDePasseRobuste('SansSpecial2026')).toBe(false);
    expect(motDePasseRobuste('SansChiffre#abc')).toBe(false);
  });

  it('ne stocke jamais le mot de passe en clair', async () => {
    const hash = await hacherMotDePasse('AsterDemo#2026');
    expect(hash).not.toContain('AsterDemo');
    expect(hash.startsWith('$2')).toBe(true);
    expect(await verifierMotDePasse('AsterDemo#2026', hash)).toBe(true);
    expect(await verifierMotDePasse('mauvais', hash)).toBe(false);
  });
});
