import { getDatabase } from "../db/connection";
import type { Client } from "../../shared/types";

export function listerClients(): Client[] {
  const db = getDatabase();
  return db
    .prepare(
      "SELECT numCompte, nom, prenoms, tel, mail, solde FROM client ORDER BY nom ASC, prenoms ASC"
    )
    .all() as Client[];
}

export function obtenirClient(numCompte: string): Client | null {
  const db = getDatabase();
  const row = db
    .prepare(
      "SELECT numCompte, nom, prenoms, tel, mail, solde FROM client WHERE numCompte = ?"
    )
    .get(numCompte) as Client | undefined;
  return row ?? null;
}

export function creerClient(client: Client): void {
  const db = getDatabase();
  db.prepare(
    "INSERT INTO client (numCompte, nom, prenoms, tel, mail, solde) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    client.numCompte,
    client.nom,
    client.prenoms,
    client.tel,
    client.mail,
    client.solde
  );
}

export function modifierClient(client: Client): void {
  const db = getDatabase();
  db.prepare(
    "UPDATE client SET nom = ?, prenoms = ?, tel = ?, mail = ?, solde = ? WHERE numCompte = ?"
  ).run(client.nom, client.prenoms, client.tel, client.mail, client.solde, client.numCompte);
}

export function supprimerClient(numCompte: string): void {
  const db = getDatabase();
  const tx = db.transaction(() => {
    db.prepare(
      `DELETE FROM rendre WHERE numPret IN (SELECT numPret FROM preter WHERE numCompte = ?)`
    ).run(numCompte);
    db.prepare("DELETE FROM preter WHERE numCompte = ?").run(numCompte);
    db.prepare(
      "DELETE FROM virement WHERE numCompteEmetteur = ? OR numCompteBeneficiaire = ?"
    ).run(numCompte, numCompte);
    db.prepare("DELETE FROM client WHERE numCompte = ?").run(numCompte);
  });
  tx();
}

export function rechercherClients(terme: string): Client[] {
  const db = getDatabase();
  const like = `%${terme}%`;
  return db
    .prepare(
      `SELECT numCompte, nom, prenoms, tel, mail, solde FROM client
       WHERE numCompte LIKE ? OR nom LIKE ? OR prenoms LIKE ?
       ORDER BY nom ASC`
    )
    .all(like, like, like) as Client[];
}
