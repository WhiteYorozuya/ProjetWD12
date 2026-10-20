import { TypeRegle } from '@prisma/client';
import { calculerInterdits } from './regles';

describe('Règles de processus', () => {
  const regles = [
    { nom: 'steam.exe', type: TypeRegle.INTERDIT, salleId: null },
    { nom: 'Wireshark.exe', type: TypeRegle.INTERDIT, salleId: null },
    { nom: 'wireshark.exe', type: TypeRegle.AUTORISE, salleId: 2 },
    { nom: 'nmap.exe', type: TypeRegle.INTERDIT, salleId: 3 },
  ];

  it('applique les interdictions globales', () => {
    expect([...calculerInterdits(regles, 1)].sort()).toEqual(['steam.exe', 'wireshark.exe']);
  });

  it("une autorisation de salle lève l'interdiction globale", () => {
    expect([...calculerInterdits(regles, 2)]).toEqual(['steam.exe']);
  });

  it("une interdiction de salle s'ajoute aux règles globales", () => {
    expect([...calculerInterdits(regles, 3)].sort()).toEqual(['nmap.exe', 'steam.exe', 'wireshark.exe']);
  });
});
