import { getDatabase } from "../db/connection";
import type { Pret, Client } from "../../shared/types";

const TAUX_COMMISSION = 0.10;

export function listerPrets(): Pret[] {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT numPret, numCompte, montantPret, commissionBanque, datePret
       FROM preter ORDER BY datePret DESC, numPret DESC`
    )
    .all() as Pret[];
}

export function obtenirPret(numPret: number): Pret | null {
  const db = getDatabase();
  const row = db
    .prepare(
      "SELECT numPret, numCompte, montantPret, commissionBanque, datePret FROM preter WHERE numPret = ?"
    )
    .get(numPret) as Pret | undefined;
  return row ?? null;
}

export interface PretDetails extends Pret {
  nomClient: string;
  prenomClient: string;
  mailClient: string;
  totalRembourse: number;
  resteARembourser: number;
  situation: "Tout paye" | "Paye une part" | "Aucun remboursement";
}

export function listerPretsDetails(): PretDetails[] {
  const db = getDatabase();
  const prets = db
    .prepare(
      `SELECT
         p.numPret, p.numCompte, p.montantPret, p.commissionBanque, p.datePret,
         c.nom AS nomClient, c.prenoms AS prenomClient, c.mail AS mailClient
       FROM preter p
       JOIN client c ON c.numCompte = p.numCompte
       ORDER BY p.datePret DESC`
    )
    .all() as Omit<PretDetails, "totalRembourse" | "resteARembourser" | "situation">[];

  return prets.map((p) => {
    const remboursements = db
      .prepare("SELECT restPaye FROM rendre WHERE numPret = ?")
      .all(p.numPret) as { restPaye: number }[];

    const totalRembourse = remboursements.reduce((s, r) => s + r.restPaye, 0);
    const resteARembourser = p.montantPret - totalRembourse;
    const situation: PretDetails["situation"] =
      remboursements.length === 0
        ? "Aucun remboursement"
        : resteARembourser <= 0
        ? "Tout paye"
        : "Paye une part";

    return {
      ...p,
      totalRembourse,
      resteARembourser,
      situation,
    };
  });
}

export interface ResultatPret {
  pret: Pret;
  client: Client;
}

export function executerPret(
  numCompte: string,
  montantPret: number,
  datePret: string
): ResultatPret {
  const db = getDatabase();

  if (!Number.isInteger(montantPret) || montantPret <= 0) {
    throw new Error("Le montant du pret doit etre un entier strictement positif");
  }
  if (!datePret) {
    throw new Error("Date du pret obligatoire");
  }

  const client = db
    .prepare("SELECT * FROM client WHERE numCompte = ?")
    .get(numCompte) as Client | undefined;

  if (!client) {
    throw new Error("Compte client introuvable");
  }

  const commissionBanque = Math.round(montantPret * TAUX_COMMISSION);
  const montantNet = montantPret - commissionBanque;

  let nouveauNumPret = 0;
  const tx = db.transaction(() => {
    const info = db.prepare(
      "INSERT INTO preter (numCompte, montantPret, commissionBanque, datePret) VALUES (?, ?, ?, ?)"
    ).run(numCompte, montantPret, commissionBanque, datePret);
    nouveauNumPret = Number(info.lastInsertRowid);

    db.prepare("UPDATE client SET solde = solde + ? WHERE numCompte = ?").run(
      montantNet,
      numCompte
    );
  });

  tx();

  const clientApres = db
    .prepare("SELECT * FROM client WHERE numCompte = ?")
    .get(numCompte) as Client;

  return {
    pret: { numPret: nouveauNumPret, numCompte, montantPret, commissionBanque, datePret },
    client: clientApres,
  };
}

export function supprimerPret(numPret: number): number {
  const db = getDatabase();
  const pret = obtenirPret(numPret);
  if (!pret) return 0;

  const tx = db.transaction(() => {
    db.prepare("UPDATE client SET solde = solde - ? WHERE numCompte = ?").run(
      pret.montantPret - pret.commissionBanque,
      pret.numCompte
    );
    db.prepare("DELETE FROM rendre WHERE numPret = ?").run(numPret);
    db.prepare("DELETE FROM preter WHERE numPret = ?").run(numPret);
  });

  tx();
  return 1;
}

export function beneficeCumuleBanque(): {
  totalCommissions: number;
  nombrePrets: number;
  montantTotalPrete: number;
} {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(commissionBanque), 0) AS totalCommissions,
         COUNT(*) AS nombrePrets,
         COALESCE(SUM(montantPret), 0) AS montantTotalPrete
       FROM preter`
    )
    .get() as { totalCommissions: number; nombrePrets: number; montantTotalPrete: number };

  return row;
}

export function pretsParSituation(): Record<string, number> {
  const prets = listerPretsDetails();
  return {
    "Tout paye": prets.filter((p) => p.situation === "Tout paye").length,
    "Paye une part": prets.filter((p) => p.situation === "Paye une part").length,
    "Aucun remboursement": prets.filter((p) => p.situation === "Aucun remboursement").length,
  };
}
