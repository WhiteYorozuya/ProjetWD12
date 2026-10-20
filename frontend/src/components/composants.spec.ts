import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import BadgeStatut from './BadgeStatut.vue';
import JaugeUsage from './JaugeUsage.vue';
import PaginationBarre from './PaginationBarre.vue';

describe('BadgeStatut', () => {
  it('affiche le texte avec la tonalité demandée', () => {
    const w = mount(BadgeStatut, { props: { ton: 'danger', texte: 'En panne' } });
    expect(w.text()).toBe('En panne');
    expect(w.classes()).toContain('danger');
  });
});

describe('JaugeUsage', () => {
  it('passe en alerte au-delà de 90 %', () => {
    const w = mount(JaugeUsage, { props: { libelle: 'CPU', valeur: 95 } });
    expect(w.classes()).toContain('danger');
    expect(w.text()).toContain('95 %');
    expect(w.find('[role="meter"]').attributes('aria-valuenow')).toBe('95');
  });

  it('affiche un tiret sans mesure', () => {
    const w = mount(JaugeUsage, { props: { libelle: 'RAM', valeur: null } });
    expect(w.text()).toContain('—');
  });
});

describe('PaginationBarre', () => {
  it('indique la plage affichée et bloque les bornes', async () => {
    const w = mount(PaginationBarre, { props: { page: 1, taille: 25, total: 60 } });
    expect(w.text()).toContain('1–25 sur 60');
    const [precedent, suivant] = w.findAll('button');
    expect(precedent.attributes('disabled')).toBeDefined();
    await suivant.trigger('click');
    expect(w.emitted('changer')?.[0]).toEqual([2]);
  });
});
