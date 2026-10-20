/**
 * Lecture / écriture CSV minimaliste (séparateur « ; » par défaut, compatible Excel FR).
 * Gère les champs entre guillemets, les guillemets doublés et les retours à la ligne.
 */

export function detecterSeparateur(entete: string): ';' | ',' {
  const pointsVirgules = (entete.match(/;/g) ?? []).length;
  const virgules = (entete.match(/,/g) ?? []).length;
  return virgules > pointsVirgules ? ',' : ';';
}

export function lireCsv(contenu: string): string[][] {
  const texte = contenu.replace(/^﻿/, ''); // BOM ajouté par Excel
  const premiereLigne = texte.split(/\r?\n/, 1)[0] ?? '';
  const sep = detecterSeparateur(premiereLigne);

  const lignes: string[][] = [];
  let ligne: string[] = [];
  let champ = '';
  let entreGuillemets = false;

  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (entreGuillemets) {
      if (c === '"' && texte[i + 1] === '"') {
        champ += '"';
        i++;
      } else if (c === '"') {
        entreGuillemets = false;
      } else {
        champ += c;
      }
    } else if (c === '"') {
      entreGuillemets = true;
    } else if (c === sep) {
      ligne.push(champ);
      champ = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++;
      ligne.push(champ);
      lignes.push(ligne);
      ligne = [];
      champ = '';
    } else {
      champ += c;
    }
  }
  if (champ !== '' || ligne.length > 0) {
    ligne.push(champ);
    lignes.push(ligne);
  }
  return lignes.filter((l) => l.some((v) => v.trim() !== ''));
}

/** Transforme un CSV avec en-tête en objets indexés par le nom de colonne (normalisé). */
export function lireCsvObjets(contenu: string): Record<string, string>[] {
  const [entete, ...lignes] = lireCsv(contenu);
  if (!entete) return [];
  const colonnes = entete.map(normaliserColonne);
  return lignes.map((l) =>
    Object.fromEntries(colonnes.map((col, i) => [col, (l[i] ?? '').trim()])),
  );
}

export function normaliserColonne(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

/**
 * Échappe une valeur pour le CSV. Neutralise aussi l'injection de formules
 * (valeurs commençant par = + - @) lorsqu'on ouvre le fichier dans Excel.
 */
export function echapperCsv(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return '';
  let texte = valeur instanceof Date ? valeur.toISOString().slice(0, 10) : String(valeur);
  if (/^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  if (/[";\n\r]/.test(texte)) texte = `"${texte.replace(/"/g, '""')}"`;
  return texte;
}

export function ecrireCsv(entete: string[], lignes: unknown[][]): string {
  const corps = [entete, ...lignes].map((l) => l.map(echapperCsv).join(';')).join('\r\n');
  return `﻿${corps}\r\n`;
}
