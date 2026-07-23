import { getDatabase } from "./connection";

export function verifierSeed(): {
  clients: number;
  virements: number;
  prets: number;
  rendus: number;
} {
  const db = getDatabase();
  const compte = (table: string) =>
    (db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get() as { n: number }).n;

  return {
    clients: compte("client"),
    virements: compte("virement"),
    prets: compte("preter"),
    rendus: compte("rendre"),
  };
}
