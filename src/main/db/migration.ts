import type Database from "better-sqlite3";

export function executerMigrations(db: Database.Database): void {
  const colonnes = db
    .prepare("PRAGMA table_info(client)")
    .all() as { name: string }[];

  const aSolde = colonnes.some((c) => c.name === "solde");
  if (!aSolde) {
    console.log("[db] Migration : ajout colonne solde");
    db.exec("ALTER TABLE client ADD COLUMN solde INTEGER NOT NULL DEFAULT 0");
  }

  const infoPret = db
    .prepare("PRAGMA table_info(preter)")
    .all() as { name: string; type: string }[];
  const estText = infoPret.some((c) => c.name === "numPret" && c.type === "TEXT");

  if (estText) {
    console.log("[db] Migration : conversion preter/rendre TEXT -> INTEGER AUTOINCREMENT");
    db.exec("PRAGMA foreign_keys = OFF");

    const oldPrets = db
      .prepare("SELECT numPret AS ancienId, numCompte, montantPret, commissionBanque, datePret FROM preter ORDER BY rowid")
      .all() as { ancienId: string; numCompte: string; montantPret: number; commissionBanque: number; datePret: string }[];

    const oldRendus = db
      .prepare("SELECT numPret AS ancienPretId, situation, restPaye, dateRendu FROM rendre ORDER BY rowid")
      .all() as { ancienPretId: string; situation: string; restPaye: number; dateRendu: string }[];

    db.exec("ALTER TABLE rendre RENAME TO rendre_old");
    db.exec("ALTER TABLE preter RENAME TO preter_old");

    db.exec(`CREATE TABLE preter (
      numPret INTEGER PRIMARY KEY AUTOINCREMENT,
      numCompte TEXT NOT NULL,
      montantPret INTEGER NOT NULL CHECK (montantPret > 0),
      commissionBanque INTEGER NOT NULL CHECK (commissionBanque >= 0),
      datePret TEXT NOT NULL,
      FOREIGN KEY (numCompte) REFERENCES client(numCompte)
    )`);

    db.exec(`CREATE TABLE rendre (
      numRendu INTEGER PRIMARY KEY AUTOINCREMENT,
      numPret INTEGER NOT NULL,
      situation TEXT NOT NULL CHECK (situation IN ('Tout paye', 'Paye une part')),
      restPaye INTEGER NOT NULL,
      dateRendu TEXT NOT NULL,
      FOREIGN KEY (numPret) REFERENCES preter(numPret)
    )`);

    const insertPret = db.prepare(
      "INSERT INTO preter (numCompte, montantPret, commissionBanque, datePret) VALUES (?, ?, ?, ?)"
    );
    const mapAncienVersNouveau = new Map<string, number>();
    for (const p of oldPrets) {
      const r = insertPret.run(p.numCompte, p.montantPret, p.commissionBanque, p.datePret);
      mapAncienVersNouveau.set(p.ancienId, Number(r.lastInsertRowid));
    }

    const insertRendre = db.prepare(
      "INSERT INTO rendre (numPret, situation, restPaye, dateRendu) VALUES (?, ?, ?, ?)"
    );
    for (const r of oldRendus) {
      const nouveauPretId = mapAncienVersNouveau.get(r.ancienPretId) ?? 1;
      insertRendre.run(nouveauPretId, r.situation, r.restPaye, r.dateRendu);
    }

    db.exec("DROP TABLE rendre_old");
    db.exec("DROP TABLE preter_old");
    db.exec("PRAGMA foreign_keys = ON");
    console.log("[db] Migration preter/rendre terminee");
  }
}
