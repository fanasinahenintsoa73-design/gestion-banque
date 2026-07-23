CREATE TABLE IF NOT EXISTS client (
  numCompte TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenoms TEXT NOT NULL,
  tel TEXT NOT NULL,
  mail TEXT NOT NULL,
  solde INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS virement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numCompteEmetteur TEXT NOT NULL,
  numCompteBeneficiaire TEXT NOT NULL,
  montant INTEGER NOT NULL CHECK (montant > 0),
  dateTransfert TEXT NOT NULL,
  FOREIGN KEY (numCompteEmetteur) REFERENCES client(numCompte),
  FOREIGN KEY (numCompteBeneficiaire) REFERENCES client(numCompte)
);

CREATE TABLE IF NOT EXISTS preter (
  numPret INTEGER PRIMARY KEY AUTOINCREMENT,
  numCompte TEXT NOT NULL,
  montantPret INTEGER NOT NULL CHECK (montantPret > 0),
  commissionBanque INTEGER NOT NULL CHECK (commissionBanque >= 0),
  datePret TEXT NOT NULL,
  FOREIGN KEY (numCompte) REFERENCES client(numCompte)
);

CREATE TABLE IF NOT EXISTS rendre (
  numRendu INTEGER PRIMARY KEY AUTOINCREMENT,
  numPret INTEGER NOT NULL,
  situation TEXT NOT NULL CHECK (situation IN ('Tout paye', 'Paye une part')),
  restPaye INTEGER NOT NULL,
  dateRendu TEXT NOT NULL,
  FOREIGN KEY (numPret) REFERENCES preter(numPret)
);

CREATE INDEX IF NOT EXISTS idx_client_nom ON client(nom);
CREATE INDEX IF NOT EXISTS idx_virement_emetteur ON virement(numCompteEmetteur);
CREATE INDEX IF NOT EXISTS idx_virement_beneficiaire ON virement(numCompteBeneficiaire);
CREATE INDEX IF NOT EXISTS idx_preter_compte ON preter(numCompte);
CREATE INDEX IF NOT EXISTS idx_rendre_pret ON rendre(numPret);
CREATE INDEX IF NOT EXISTS idx_rendre_situation ON rendre(situation);
