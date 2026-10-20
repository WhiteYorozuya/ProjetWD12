import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, construireUrl, ErreurApi, jeton, quandSessionExpiree } from './client';

function reponse(statut: number, corps: unknown) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });
}

describe('client API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    jeton.ecrire(null);
  });

  it('ignore les paramètres vides dans la requête', () => {
    expect(construireUrl('/materiels', { recherche: 'hp', typeId: '', etat: undefined, page: 2 })).toBe(
      '/api/materiels?recherche=hp&page=2',
    );
  });

  it('envoie le jeton dans l’en-tête Authorization', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    jeton.ecrire('abc');
    await api('/auth/moi');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc');
  });

  it("traduit les erreurs de validation de l'API en message lisible", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponse(400, { message: ['marque manquante', 'modèle manquant'] })));
    await expect(api('/materiels', { methode: 'POST', corps: {} })).rejects.toThrow('marque manquante · modèle manquant');
  });

  it('signale une session expirée', async () => {
    const expiree = vi.fn();
    quandSessionExpiree(expiree);
    jeton.ecrire('perime');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponse(401, { message: 'Session expirée' })));
    await expect(api('/materiels')).rejects.toBeInstanceOf(ErreurApi);
    expect(expiree).toHaveBeenCalled();
  });

  it('explique une panne réseau', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api('/materiels')).rejects.toThrow(/ne répond pas/);
  });
});
