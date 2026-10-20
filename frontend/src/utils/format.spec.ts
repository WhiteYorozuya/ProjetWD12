import { describe, expect, it } from 'vitest';
import { depuis, pourcent, versInputDate } from './format';

describe('format', () => {
  const maintenant = new Date('2026-10-20T10:00:00Z').getTime();

  it('exprime une durée écoulée lisible', () => {
    expect(depuis('2026-10-20T09:59:30Z', maintenant)).toBe('il y a 30 s');
    expect(depuis('2026-10-20T09:45:00Z', maintenant)).toBe('il y a 15 min');
    expect(depuis('2026-10-20T07:00:00Z', maintenant)).toBe('il y a 3 h');
    expect(depuis('2026-10-17T10:00:00Z', maintenant)).toBe('il y a 3 j');
    expect(depuis(null, maintenant)).toBe('jamais');
  });

  it('formate les pourcentages', () => {
    expect(pourcent(42.6)).toBe('43 %');
    expect(pourcent(null)).toBe('—');
  });

  it('prépare une date pour un champ date', () => {
    expect(versInputDate('2026-09-28T00:00:00.000Z')).toBe('2026-09-28');
    expect(versInputDate(null)).toBe('');
  });
});
