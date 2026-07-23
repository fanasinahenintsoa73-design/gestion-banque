import { getDatabase } from "../db/connection";
import type { Rendre, Pret } from "../../shared/types";

export function listerRemboursements(): Rendre[] {
  const db = getDatabase();
  return db
    .prepare(
      "SELECT numRendu, numPret, situation, restPaye, dateRendu FROM rendre ORDER BY dateRendu DESC, numRendu DESC"
    )
    .all() as Rendre[];
}

export function listerRemboursementsParPret(numPret: number): Rendre[] {
  const db = getDatabase();
  return db
    .prepare(
      "SELECT numRendu, numPret, situation, restPaye, dateRendu FROM rendre WHERE numPret = ? ORDER BY dateRendu DESC"
    )
    .all(numPret) as Rendre[];
}

export interface ResultatRemboursement {
  remboursement: Rendre;
  pret: Pret;
  nouveauSoldeClient: number;
}

export function executerRemboursement(
  numPret: number,
  restPaye: number,
  dateRendu: string
): ResultatRemboursement {
  const db = getDatabase();

  if (!numPret) {
    throw new Error("Numero de pret obligatoire");
  }
  if (!Number.isInteger(restPaye) || restPaye < 0) {
    throw new Error("Le montant rembourse doit etre un entier positif ou nul");
  }
  if (!dateRendu) {
    throw new Error("Date du remboursement obligatoire");
  }

  const pret = db
    .prepare("SELECT * FROM preter WHERE numPret = ?")
    .get(numPret) as Pret | undefined;

  if (!pret) {
    throw new Error("Pret introuvable");
  }

  const dejaRembourseRow = db
    .prepare("SELECT COALESCE(SUM(restPaye), 0) AS total FROM rendre WHERE numPret = ?")
    .get(numPret) as { total: number };

  const dejaRembourse = dejaRembourseRow.total;
  const reste = pret.montantPret - dejaRembourse;

  if (restPaye > reste) {
    throw new Error(
      `Le remboursement (${restPaye} Ar) depasse le reste a payer (${reste} Ar)`
    );
  }

  const nouveauReste = reste - restPaye;
  const situation: "Tout paye" | "Paye une part" =
    nouveauReste === 0 ? "Tout paye" : "Paye une part";

  let nouveauNumRendu = 0;
  const tx = db.transaction(() => {
    const info = db.prepare(
      "INSERT INTO rendre (numPret, situation, restPaye, dateRendu) VALUES (?, ?, ?, ?)"
    ).run(numPret, situation, restPaye, dateRendu);
    nouveauNumRendu = Number(info.lastInsertRowid);

    db.prepare("UPDATE client SET solde = solde - ? WHERE numCompte = ?").run(
      restPaye,
      pret.numCompte
    );
  });

  tx();

  const clientApres = db
    .prepare("SELECT * FROM client WHERE numCompte = ?")
    .get(pret.numCompte) as { solde: number };

  return {
    remboursement: { numRendu: nouveauNumRendu, numPret, situation, restPaye, dateRendu },
    pret,
    nouveauSoldeClient: clientApres.solde,
  };
}

export function supprimerRemboursement(numRendu: number): number {
  const db = getDatabase();
  const row = db
    .prepare("SELECT * FROM rendre WHERE numRendu = ?")
    .get(numRendu) as Rendre | undefined;

  if (!row) return 0;

  const tx = db.transaction(() => {
    db.prepare("UPDATE client SET solde = solde + ? WHERE numCompte = ?").run(
      row.restPaye,
      (
        db.prepare("SELECT numCompte FROM preter WHERE numPret = ?").get(row.numPret) as {
          numCompte: string;
        }
      ).numCompte
    );
    db.prepare("DELETE FROM rendre WHERE numRendu = ?").run(numRendu);
  });

  tx();
  return 1;
}
