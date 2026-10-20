import { detecterSeparateur, echapperCsv, ecrireCsv, lireCsv, lireCsvObjets, normaliserColonne } from './csv';

describe('CSV', () => {
  it('détecte le séparateur point-virgule (Excel FR) ou virgule', () => {
    expect(detecterSeparateur('a;b;c')).toBe(';');
    expect(detecterSeparateur('a,b,c')).toBe(',');
  });

  it('lit les champs entre guillemets, guillemets doublés et retours à la ligne', () => {
    const lignes = lireCsv('a;b\r\n"x;y";"il dit ""bonjour"""\n"multi\nligne";z\n');
    expect(lignes).toEqual([
      ['a', 'b'],
      ['x;y', 'il dit "bonjour"'],
      ['multi\nligne', 'z'],
    ]);
  });

  it('ignore le BOM et les lignes vides', () => {
    expect(lireCsv('﻿a;b\n\n1;2\n;\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('normalise les noms de colonnes (accents, casse, espaces)', () => {
    expect(normaliserColonne('Numéro Série')).toBe('numeroserie');
    expect(normaliserColonne('dateReception')).toBe('datereception');
  });

  it('transforme en objets indexés par colonne', () => {
    expect(lireCsvObjets('numeroSerie;Type\nABC ; UC\n')).toEqual([{ numeroserie: 'ABC', type: 'UC' }]);
  });

  it("neutralise l'injection de formules à l'export", () => {
    expect(echapperCsv('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(echapperCsv('+33')).toBe("'+33");
    expect(echapperCsv('normal')).toBe('normal');
  });

  it('écrit un CSV relisible', () => {
    const csv = ecrireCsv(['a', 'b'], [['x;1', new Date('2026-01-02T10:00:00Z')]]);
    expect(lireCsvObjets(csv)).toEqual([{ a: 'x;1', b: '2026-01-02' }]);
  });
});
