import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jeton } from '@/api/client';
import { useAuthStore } from './auth';

describe('store auth', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    jeton.ecrire(null);
    vi.unstubAllGlobals();
  });

  it('connecte, mémorise le jeton et calcule les droits', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ jeton: 'j1', utilisateur: { id: 1, email: 'f@x', nom: 'P', prenom: 'A', role: 'FORMATEUR' } }),
          { status: 200 },
        ),
      ),
    );
    const auth = useAuthStore();
    await auth.connecter('f@x', 'secret');
    expect(auth.connecte).toBe(true);
    expect(jeton.lire()).toBe('j1');
    expect(auth.peut('superviser')).toBe(true);
    expect(auth.peut('gererMateriel')).toBe(false);
  });

  it('oublie le jeton à la déconnexion', () => {
    jeton.ecrire('j1');
    const auth = useAuthStore();
    auth.deconnecter();
    expect(jeton.lire()).toBeNull();
    expect(auth.connecte).toBe(false);
  });

  it('abandonne une session invalide au rechargement', async () => {
    jeton.ecrire('perime');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"message":"x"}', { status: 401 })));
    const auth = useAuthStore();
    await auth.restaurer();
    expect(auth.connecte).toBe(false);
    expect(jeton.lire()).toBeNull();
  });
});
