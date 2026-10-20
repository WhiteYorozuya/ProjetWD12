import PDFDocument from 'pdfkit';

export type DocPdf = InstanceType<typeof PDFDocument>;

export interface Colonne {
  titre: string;
  largeur: number; // en points
}

const MARGE = 40;
const COULEUR_TEXTE = '#1d2433';
const COULEUR_DOUCE = '#5b6474';
const COULEUR_LIGNE = '#c9ced8';
const COULEUR_ENTETE = '#e8ebf1';

export function creerDocument(titre: string, sousTitre: string): DocPdf {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGE, bottom: MARGE + 10, left: MARGE, right: MARGE },
    info: { Title: titre, Author: 'ParcForm', Creator: 'ParcForm' },
    bufferPages: true,
  });
  doc.fillColor(COULEUR_TEXTE);
  doc.font('Helvetica-Bold').fontSize(18).text(titre);
  doc.font('Helvetica').fontSize(10).fillColor(COULEUR_DOUCE).text(sousTitre);
  doc.moveDown(0.8).fillColor(COULEUR_TEXTE);
  return doc;
}

export function titreSection(doc: DocPdf, texte: string) {
  verifierPlace(doc, 40);
  doc.moveDown(0.6).font('Helvetica-Bold').fontSize(12).fillColor(COULEUR_TEXTE).text(texte, MARGE);
  doc.moveDown(0.3).font('Helvetica').fontSize(9);
}

export function paragraphe(doc: DocPdf, texte: string) {
  doc.font('Helvetica').fontSize(9).fillColor(COULEUR_TEXTE).text(texte, MARGE);
}

function verifierPlace(doc: DocPdf, hauteur: number) {
  if (doc.y + hauteur > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

/** Tableau simple avec en-tête répété à chaque saut de page. */
export function tableau(doc: DocPdf, colonnes: Colonne[], lignes: string[][]) {
  const largeurTotale = colonnes.reduce((s, c) => s + c.largeur, 0);
  const padding = 4;

  const dessinerLigne = (valeurs: string[], entete: boolean) => {
    doc.font(entete ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
    const hauteurs = valeurs.map((v, i) =>
      doc.heightOfString(v || ' ', { width: colonnes[i].largeur - 2 * padding }),
    );
    const h = Math.max(...hauteurs) + 2 * padding;
    if (doc.y + h > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      if (!entete) dessinerLigne(colonnes.map((c) => c.titre), true);
      doc.font(entete ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5); // l'en-tête répété a changé la police
    }
    const y = doc.y;
    if (entete) doc.rect(MARGE, y, largeurTotale, h).fill(COULEUR_ENTETE);
    doc.fillColor(COULEUR_TEXTE);
    let x = MARGE;
    valeurs.forEach((v, i) => {
      doc.text(v || '', x + padding, y + padding, { width: colonnes[i].largeur - 2 * padding });
      x += colonnes[i].largeur;
    });
    doc
      .moveTo(MARGE, y + h)
      .lineTo(MARGE + largeurTotale, y + h)
      .lineWidth(0.5)
      .strokeColor(COULEUR_LIGNE)
      .stroke();
    doc.x = MARGE;
    doc.y = y + h;
  };

  dessinerLigne(colonnes.map((c) => c.titre), true);
  if (lignes.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(COULEUR_DOUCE).text('Aucun élément', MARGE + padding, doc.y + padding);
    doc.fillColor(COULEUR_TEXTE);
    return;
  }
  lignes.forEach((l) => dessinerLigne(l, false));
}

/** Deux cadres de signature côte à côte. */
export function signatures(doc: DocPdf, gauche: string, droite: string) {
  verifierPlace(doc, 110);
  doc.moveDown(1.2);
  const y = doc.y;
  const largeur = (doc.page.width - 2 * MARGE - 20) / 2;
  [gauche, droite].forEach((titre, i) => {
    const x = MARGE + i * (largeur + 20);
    doc.rect(x, y, largeur, 95).lineWidth(0.7).strokeColor(COULEUR_LIGNE).stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COULEUR_TEXTE).text(titre, x + 8, y + 8, { width: largeur - 16 });
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(COULEUR_DOUCE)
      .text('Grade, nom, prénom :', x + 8, y + 28)
      .text('Date :', x + 8, y + 46)
      .text('Signature :', x + 8, y + 64);
  });
  doc.fillColor(COULEUR_TEXTE);
  doc.x = MARGE;
  doc.y = y + 105;
}

/** Numérotation « page x / n » en pied de page. */
export function numeroterPages(doc: DocPdf, mention: string) {
  const plage = doc.bufferedPageRange();
  for (let i = plage.start; i < plage.start + plage.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - MARGE + 5;
    doc.page.margins.bottom = 0; // autorise l'écriture dans la marge basse
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(COULEUR_DOUCE)
      .text(`${mention} — page ${i + 1} / ${plage.count}`, MARGE, y, {
        width: doc.page.width - 2 * MARGE,
        align: 'center',
        lineBreak: false,
      });
  }
}

export function enBuffer(doc: DocPdf): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const morceaux: Buffer[] = [];
    doc.on('data', (m: Buffer) => morceaux.push(m));
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);
    doc.end();
  });
}
