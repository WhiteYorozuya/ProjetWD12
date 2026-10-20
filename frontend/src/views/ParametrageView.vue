<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '@/api/client';
import type { Application, Formation, TypeMateriel } from '@/api/types';
import FenetreModale from '@/components/FenetreModale.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { useReferentielStore } from '@/stores/referentiel';

const auth = useAuthStore();
const notifications = useNotificationsStore();
const referentiel = useReferentielStore();

type Onglet = 'types' | 'formations' | 'applications';
const onglet = ref<Onglet>('types');
const types = ref<TypeMateriel[]>([]);
const formations = ref<Formation[]>([]);
const applications = ref<Application[]>([]);

const edition = ref<{ quoi: Onglet; id: number | null } | null>(null);
const fType = reactive({ libelle: '', dureeAptitudeMois: 60, formationIds: [] as number[] });
const fFormation = reactive({ intitule: '', description: '', dureeHeures: 1 });
const fApplication = reactive({ nom: '', editeur: '', metier: true });

async function charger() {
  try {
    [types.value, formations.value, applications.value] = await Promise.all([
      api<TypeMateriel[]>('/types-materiel'),
      api<Formation[]>('/formations'),
      api<Application[]>('/applications'),
    ]);
  } catch (e) {
    notifications.erreur(e);
  }
}
onMounted(charger);

function ouvrirType(t?: TypeMateriel) {
  Object.assign(fType, {
    libelle: t?.libelle ?? '',
    dureeAptitudeMois: t?.dureeAptitudeMois ?? 60,
    formationIds: t?.formations?.map((f) => f.id) ?? [],
  });
  edition.value = { quoi: 'types', id: t?.id ?? null };
}
function ouvrirFormation(f?: Formation) {
  Object.assign(fFormation, { intitule: f?.intitule ?? '', description: f?.description ?? '', dureeHeures: f?.dureeHeures ?? 1 });
  edition.value = { quoi: 'formations', id: f?.id ?? null };
}
function ouvrirApplication(a?: Application) {
  Object.assign(fApplication, { nom: a?.nom ?? '', editeur: a?.editeur ?? '', metier: a?.metier ?? true });
  edition.value = { quoi: 'applications', id: a?.id ?? null };
}

const chemins: Record<Onglet, string> = { types: '/types-materiel', formations: '/formations', applications: '/applications' };

async function enregistrer() {
  if (!edition.value) return;
  const { quoi, id } = edition.value;
  const corps =
    quoi === 'types'
      ? { ...fType }
      : quoi === 'formations'
        ? { ...fFormation, description: fFormation.description || undefined }
        : { ...fApplication, editeur: fApplication.editeur || undefined };
  try {
    await api(id ? `${chemins[quoi]}/${id}` : chemins[quoi], { methode: id ? 'PATCH' : 'POST', corps });
    notifications.succes('Paramétrage enregistré');
    edition.value = null;
    await Promise.all([charger(), referentiel.charger(true)]);
  } catch (e) {
    notifications.erreur(e);
  }
}

async function supprimer(quoi: Onglet, id: number, libelle: string) {
  if (!confirm(`Supprimer « ${libelle} » ?`)) return;
  try {
    await api(`${chemins[quoi]}/${id}`, { methode: 'DELETE' });
    await Promise.all([charger(), referentiel.charger(true)]);
  } catch (e) {
    notifications.erreur(e);
  }
}

function basculerFormation(id: number) {
  const i = fType.formationIds.indexOf(id);
  if (i >= 0) fType.formationIds.splice(i, 1);
  else fType.formationIds.push(id);
}
</script>

<template>
  <div>
    <header class="entete-page">
      <div>
        <h1>Paramétrage</h1>
        <p>Durées d'aptitude par type de matériel, formations induites et catalogue des applications métier.</p>
      </div>
    </header>

    <div class="onglets" role="tablist">
      <button role="tab" :aria-selected="onglet === 'types'" :class="{ actif: onglet === 'types' }" @click="onglet = 'types'">
        Types de matériel
      </button>
      <button role="tab" :aria-selected="onglet === 'formations'" :class="{ actif: onglet === 'formations' }" @click="onglet = 'formations'">
        Formations induites
      </button>
      <button role="tab" :aria-selected="onglet === 'applications'" :class="{ actif: onglet === 'applications' }" @click="onglet = 'applications'">
        Applications
      </button>
    </div>

    <section v-if="onglet === 'types'" role="tabpanel">
      <div class="barre">
        <p class="discret">La fin d'aptitude d'un matériel = date de réception + durée d'aptitude de son type.</p>
        <button v-if="auth.peut('parametrer')" class="btn btn-principal" @click="ouvrirType()">Ajouter un type</button>
      </div>
      <div class="table-conteneur">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th class="num">Durée d'aptitude</th>
              <th>Formations induites</th>
              <th class="num">Matériels</th>
              <th v-if="auth.peut('parametrer')"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in types" :key="t.id">
              <td><strong>{{ t.libelle }}</strong></td>
              <td class="num">{{ t.dureeAptitudeMois }} mois <span class="discret petit">({{ (t.dureeAptitudeMois / 12).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) }} ans)</span></td>
              <td>{{ t.formations?.map((f) => f.intitule).join(', ') || '—' }}</td>
              <td class="num">{{ t._count?.materiels }}</td>
              <td v-if="auth.peut('parametrer')" class="num">
                <button class="btn btn-petit btn-discret" @click="ouvrirType(t)">Modifier</button>
                <button class="btn btn-petit btn-discret" @click="supprimer('types', t.id, t.libelle)">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="onglet === 'formations'" role="tabpanel">
      <div class="barre">
        <p class="discret">Formations à suivre pour utiliser ou administrer un type de matériel.</p>
        <button v-if="auth.peut('parametrer')" class="btn btn-principal" @click="ouvrirFormation()">Ajouter une formation</button>
      </div>
      <div class="table-conteneur">
        <table>
          <thead>
            <tr>
              <th>Formation</th>
              <th class="num">Durée</th>
              <th>Types concernés</th>
              <th v-if="auth.peut('parametrer')"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in formations" :key="f.id">
              <td><strong>{{ f.intitule }}</strong><div class="discret petit">{{ f.description }}</div></td>
              <td class="num">{{ f.dureeHeures }} h</td>
              <td>{{ f.typesMateriel?.map((t) => t.libelle).join(', ') || '—' }}</td>
              <td v-if="auth.peut('parametrer')" class="num">
                <button class="btn btn-petit btn-discret" @click="ouvrirFormation(f)">Modifier</button>
                <button class="btn btn-petit btn-discret" @click="supprimer('formations', f.id, f.intitule)">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="onglet === 'applications'" role="tabpanel">
      <div class="barre">
        <p class="discret">Les applications inconnues détectées par les agents sont ajoutées automatiquement en catégorie « Autre ».</p>
        <button v-if="auth.peut('gererApplications')" class="btn btn-principal" @click="ouvrirApplication()">Ajouter une application</button>
      </div>
      <div class="table-conteneur">
        <table>
          <thead>
            <tr>
              <th>Application</th>
              <th>Éditeur</th>
              <th>Catégorie</th>
              <th class="num">Postes</th>
              <th v-if="auth.peut('gererApplications')"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in applications" :key="a.id">
              <td><strong>{{ a.nom }}</strong></td>
              <td>{{ a.editeur ?? '—' }}</td>
              <td>{{ a.metier ? 'Métier' : 'Autre' }}</td>
              <td class="num">{{ a._count?.postes }}</td>
              <td v-if="auth.peut('gererApplications')" class="num">
                <button class="btn btn-petit btn-discret" @click="ouvrirApplication(a)">Modifier</button>
                <button class="btn btn-petit btn-discret" @click="supprimer('applications', a.id, a.nom)">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <FenetreModale v-if="edition" :titre="edition.id ? 'Modifier' : 'Ajouter'" @fermer="edition = null">
      <form @submit.prevent="enregistrer">
        <template v-if="edition.quoi === 'types'">
          <div class="grille-form">
            <label class="champ"><span>Libellé</span><input v-model.trim="fType.libelle" required maxlength="60" /></label>
            <label class="champ">
              <span>Durée d'aptitude (mois)</span>
              <input v-model.number="fType.dureeAptitudeMois" type="number" min="1" max="360" required />
            </label>
          </div>
          <fieldset class="formations">
            <legend>Formations induites</legend>
            <label v-for="f in formations" :key="f.id" class="case">
              <input type="checkbox" :checked="fType.formationIds.includes(f.id)" @change="basculerFormation(f.id)" />
              {{ f.intitule }}
            </label>
            <p v-if="!formations.length" class="discret">Aucune formation définie.</p>
          </fieldset>
        </template>
        <template v-else-if="edition.quoi === 'formations'">
          <div class="grille-form">
            <label class="champ"><span>Intitulé</span><input v-model.trim="fFormation.intitule" required maxlength="120" /></label>
            <label class="champ">
              <span>Durée (heures)</span>
              <input v-model.number="fFormation.dureeHeures" type="number" min="1" max="1000" />
            </label>
          </div>
          <label class="champ espace"><span>Description</span><textarea v-model.trim="fFormation.description" maxlength="1000" /></label>
        </template>
        <template v-else>
          <div class="grille-form">
            <label class="champ"><span>Nom</span><input v-model.trim="fApplication.nom" required maxlength="120" /></label>
            <label class="champ"><span>Éditeur</span><input v-model.trim="fApplication.editeur" maxlength="120" /></label>
          </div>
          <label class="case espace"><input v-model="fApplication.metier" type="checkbox" /> Application métier</label>
        </template>
        <div class="actions">
          <button type="button" class="btn" @click="edition = null">Annuler</button>
          <button type="submit" class="btn btn-principal">Enregistrer</button>
        </div>
      </form>
    </FenetreModale>
  </div>
</template>

<style scoped>
.onglets {
  display: flex;
  gap: 1.4rem;
  border-bottom: 1px solid var(--trait-fort);
  margin-bottom: 1.2rem;
  overflow-x: auto;
}
.onglets button {
  padding: 0.5rem 0;
  border: 0;
  border-bottom: 3px solid transparent;
  background: none;
  font: inherit;
  font-weight: 600;
  color: var(--encre-douce);
  cursor: pointer;
  white-space: nowrap;
}
.onglets button.actif {
  color: var(--encre);
  border-bottom-color: var(--signal);
}
.barre {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.8rem;
}
.barre p {
  margin: 0;
}
.formations {
  margin-top: 1rem;
  border: 1px solid var(--trait);
  border-radius: var(--rayon);
  padding: 0.6rem 0.9rem;
}
.case {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.2rem 0;
}
.espace {
  margin-top: 0.9rem;
}
</style>
