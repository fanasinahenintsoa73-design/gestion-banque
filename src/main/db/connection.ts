import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { app } from "electron";
import { executerMigrations } from "./migration";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath("userData");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, "banque.db");
  db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initialiserSchema(db);
  executerMigrations(db);
  initialiserSeed(db);

  return db;
}

function initialiserSchema(database: Database.Database): void {
  const candidats = [
    path.join(__dirname, "schema.sql"),
    path.join(__dirname, "..", "..", "..", "src", "main", "db", "schema.sql"),
  ];

  for (const chemin of candidats) {
    if (fs.existsSync(chemin)) {
      const sql = fs.readFileSync(chemin, "utf-8");
      database.exec(sql);
      console.log("[db] Schema initialise depuis", chemin);
      return;
    }
  }

  console.warn("[db] schema.sql introuvable, base creee vide");
}

function initialiserSeed(database: Database.Database): void {
  const row = database
    .prepare("SELECT COUNT(*) as n FROM client")
    .get() as { n: number };

  if (row.n > 0) return;

  const tx = database.transaction(() => {
    const insertClient = database.prepare(
      "INSERT INTO client (numCompte, nom, prenoms, tel, mail, solde) VALUES (?, ?, ?, ?, ?, ?)"
    );
    insertClient.run("200543", "RAKOTO", "Bernard", "+261 32 11 222 33", "rakoto.bernard@example.mg", 15000000);
    insertClient.run("202908", "RANDRIA", "Barthelemy", "+261 33 22 333 44", "randria.barthelemy@example.mg", 8000000);
    insertClient.run("203017", "RABE", "Solange", "+261 34 33 444 55", "rabe.solange@example.mg", 5000000);

    const insertVirement = database.prepare(
      "INSERT INTO virement (numCompteEmetteur, numCompteBeneficiaire, montant, dateTransfert) VALUES (?, ?, ?, ?)"
    );
    insertVirement.run("200543", "202908", 2000000, "2023-04-23");
    insertVirement.run("202908", "203017", 500000, "2023-04-25");

    const insertPret = database.prepare(
      "INSERT INTO preter (numCompte, montantPret, commissionBanque, datePret) VALUES (?, ?, ?, ?)"
    );
    const r1 = insertPret.run("200543", 10000000, 1000000, "2023-03-15");
    const r2 = insertPret.run("203017", 5000000, 500000, "2023-04-10");

    const insertRendre = database.prepare(
      "INSERT INTO rendre (numPret, situation, restPaye, dateRendu) VALUES (?, ?, ?, ?)"
    );
    insertRendre.run(Number(r2.lastInsertRowid), "Paye une part", 2000000, "2023-04-28");
  });

  tx();
  console.log("[db] Seed initial cree");
}

export function fermerDatabase(): void {
  if (db) {
    try {
      db.close();
    } catch (err) {
      console.error("[db] Erreur fermeture", err);
    }
    db = null;
  }
}
