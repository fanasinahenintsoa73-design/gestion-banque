import { getDatabase } from "../db/connection";
import type { Virement, Client } from "../../shared/types";

export function listerVirements(): Virement[] {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT id, numCompteEmetteur, numCompteBeneficiaire, montant, dateTransfert
       FROM virement ORDER BY dateTransfert DESC, id DESC`
    )
    .all() as Virement[];
}

export function obtenirVirement(id: number): Virement | null {
  const db = getDatabase();
  const row = db
    .prepare(
      "SELECT id, numCompteEmetteur, numCompteBeneficiaire, montant, dateTransfert FROM virement WHERE id = ?"
    )
    .get(id) as Virement | undefined;
  return row ?? null;
}

export interface VirementDetails extends Virement {
  nomEmetteur: string;
  prenomEmetteur: string;
  nomBeneficiaire: string;
  prenomBeneficiaire: string;
  soldeEmetteurApres: number;
  soldeBeneficiaireApres: number;
}

export function listerVirementsDetails(): VirementDetails[] {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT
         v.id, v.numCompteEmetteur, v.numCompteBeneficiaire,
         v.montant, v.dateTransfert,
         ce.nom AS nomEmetteur, ce.prenoms AS prenomEmetteur,
         cb.nom AS nomBeneficiaire, cb.prenoms AS prenomBeneficiaire,
         ce.solde AS soldeEmetteurApres,
         cb.solde AS soldeBeneficiaireApres
       FROM virement v
       JOIN client ce ON ce.numCompte = v.numCompteEmetteur
       JOIN client cb ON cb.numCompte = v.numCompteBeneficiaire
       ORDER BY v.dateTransfert DESC, v.id DESC`
    )
    .all() as VirementDetails[];
}

export interface ResultatVirement {
  virement: Virement;
  emetteur: Client;
  beneficiaire: Client;
}

export function executerVirement(
  numCompteEmetteur: string,
  numCompteBeneficiaire: string,
  montant: number,
  dateTransfert: string
): ResultatVirement {
  const db = getDatabase();

  if (numCompteEmetteur === numCompteBeneficiaire) {
    throw new Error("L'emetteur et le beneficiaire doivent etre differents");
  }

  if (!Number.isInteger(montant) || montant <= 0) {
    throw new Error("Le montant doit etre un entier strictement positif");
  }

  const emetteur = db
    .prepare("SELECT * FROM client WHERE numCompte = ?")
    .get(numCompteEmetteur) as Client | undefined;

  const beneficiaire = db
    .prepare("SELECT * FROM client WHERE numCompte = ?")
    .get(numCompteBeneficiaire) as Client | undefined;

  if (!emetteur) throw new Error("Compte emetteur introuvable");
  if (!beneficiaire) throw new Error("Compte beneficiaire introuvable");

  if (emetteur.solde < montant) {
    throw new Error(
      `Solde insuffisant (disponible : ${emetteur.solde} Ar, demande : ${montant} Ar)`
    );
  }

  const tx = db.transaction(() => {
    db.prepare("UPDATE client SET solde = solde - ? WHERE numCompte = ?").run(
      montant,
      numCompteEmetteur
    );
    db.prepare("UPDATE client SET solde = solde + ? WHERE numCompte = ?").run(
      montant,
      numCompteBeneficiaire
    );

    const info = db
      .prepare(
        "INSERT INTO virement (numCompteEmetteur, numCompteBeneficiaire, montant, dateTransfert) VALUES (?, ?, ?, ?)"
      )
      .run(numCompteEmetteur, numCompteBeneficiaire, montant, dateTransfert);

    return Number(info.lastInsertRowid);
  });

  const idVirement = tx();

  const virement: Virement = {
    id: idVirement,
    numCompteEmetteur,
    numCompteBeneficiaire,
    montant,
    dateTransfert,
  };

  const emetteurApres = db
    .prepare("SELECT * FROM client WHERE numCompte = ?")
    .get(numCompteEmetteur) as Client;

  const beneficiaireApres = db
    .prepare("SELECT * FROM client WHERE numCompte = ?")
    .get(numCompteBeneficiaire) as Client;

  return {
    virement,
    emetteur: emetteurApres,
    beneficiaire: beneficiaireApres,
  };
}

export function supprimerVirement(id: number): number {
  const db = getDatabase();
  const virement = obtenirVirement(id);
  if (!virement) return 0;

  const tx = db.transaction(() => {
    db.prepare("UPDATE client SET solde = solde + ? WHERE numCompte = ?").run(
      virement.montant,
      virement.numCompteEmetteur
    );
    db.prepare("UPDATE client SET solde = solde - ? WHERE numCompte = ?").run(
      virement.montant,
      virement.numCompteBeneficiaire
    );
    db.prepare("DELETE FROM virement WHERE id = ?").run(id);
  });

  tx();
  return 1;
}
