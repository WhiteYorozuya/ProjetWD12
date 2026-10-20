import * as bcrypt from 'bcryptjs';

const COUT_BCRYPT = 12;

export function hacherMotDePasse(motDePasse: string): Promise<string> {
  return bcrypt.hash(motDePasse, COUT_BCRYPT);
}

export function verifierMotDePasse(motDePasse: string, hash: string): Promise<boolean> {
  return bcrypt.compare(motDePasse, hash);
}

/** Politique ANSSI simplifiée : 12 caractères minimum et 4 classes de caractères. */
export function motDePasseRobuste(motDePasse: string): boolean {
  return (
    motDePasse.length >= 12 &&
    /[a-z]/.test(motDePasse) &&
    /[A-Z]/.test(motDePasse) &&
    /[0-9]/.test(motDePasse) &&
    /[^a-zA-Z0-9]/.test(motDePasse)
  );
}
