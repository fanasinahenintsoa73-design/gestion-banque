# Banque Desktop

Application desktop de gestion des virements et prets bancaires avec notifications email.

## Stack

- **Frontend** : React 18 + TypeScript + Vite 5 + Tailwind CSS
- **Desktop** : Electron 31
- **Base de donnees** : SQLite via better-sqlite3
- **PDF** : pdfkit
- **Email** : nodemailer (SMTP)
- **Design** : Spotify-inspired dark theme (#121212, #181818, accent #1ed760)

## Pre-requis

- Node.js 18+
- npm

## Installation

```bash
# Installer les dependances
npm install

# (Optionnel) Configurer SMTP pour les notifications email
cp .env.example .env
# Editer .env avec vos identifiants SMTP (Gmail app password recommande)
```

## Developpement

```bash
npm run dev
```

Lance Vite (HMR sur localhost:5173) et Electron simultanement.

## Production

```bash
npm run build
```

Genere l'installeur portable Windows dans le dossier `release/`.

## Architecture

```
src/
  main/               # Processus principal Electron
    db/
      schema.sql      # 4 tables : client, virement, preter, rendre
      connection.ts   # Singleton SQLite (WAL, foreign_keys)
      seed.ts         # Donnees initiales (3 clients, 2 virements, 2 prets, 1 rendu)
    dao/              # Data Access Objects
      clientDao.ts    # CRUD + recherche LIKE (numCompte, nom, prenoms)
      virementDao.ts  # Creation transactionnelle debit/credit + suppression
      pretDao.ts      # Creation avec commission 10%, suppression, stats
      rendreDao.ts    # Creation avec mise a jour automatique situation
    ipc/              # Handlers IPC bridge Electron
      clients.ts      # Validation, CRUD, recherche LIKE
      virements.ts    # Execution, annulation
      pretRendre.ts   # Prets, remboursements, benefice cumule
      pdf.ts          # Generation PDF + ouverture systeme
      email.ts        # SMTP config, test, notification prets
    services/
      pdfService.ts   # Avis de virement PDF (pdfkit)
      emailService.ts # Nodemailer, template dark notification pret
    main.ts           # Point d'entree, enregistrement handlers
    preload.ts        # Exposition API au renderer (contextBridge)
  shared/
    types.ts          # Interfaces TypeScript partagees
  renderer/
    components/
      ui/             # 10 composants : Button, Card, Input, Select, Modal, Table, Alert, Badge, StatCard, EmptyState, Textarea
      forms/          # ClientForm, PretForm, RemboursementForm (react-hook-form + zod)
    pages/
      Dashboard.tsx   # Vue d'ensemble, stats, derniers virements, prets en cours
      Clients.tsx     # CRUD + recherche LIKE SQL (debounced)
      Virements.tsx   # Execution virement + generation PDF + annulation
      Prets.tsx       # Octroi avec commission 10%, filtres par situation, notification email auto
      Remboursements.tsx # Suivi remboursements, etat prets, historique
      Benefice.tsx    # Benefice cumule, barre empilee capital/commission, taux remboursement
      Parametres.tsx  # Configuration SMTP, tests, dossier PDF, infos systeme
    lib/
      utils.ts        # formatMontant, formatDate, cn()
      validations.ts  # Schemas zod, calculerCommission, calculerNet
```

## Bareme couvert

| Critere                                          | Points | Statut    | Implementation                                                                 |
|--------------------------------------------------|--------|-----------|--------------------------------------------------------------------------------|
| 1. CRUD 4 tables (client, virement, pret, rendre) | 10/10  | Complete  | Toutes les pages avec modales, validation, transactions ACID                  |
| 2. Recherche LIKE                                | 1/1    | Complete  | `clients:rechercher` via SQL LIKE %term% avec debounce (300ms)                |
| 3. Generation PDF avis de virement               | 3/3    | Complete  | pdfkit, sauvegarde Documents/Banque-Avis/, ouverture auto dans le viewer      |
| 4. Liste des prets par situation                  | 1/1    | Complete  | 3 cartes filtrables (Tout paye, Paye une part, Aucun remboursement)           |
| 5. Benefice cumule de la banque                   | 2/2    | Complete  | SUM(commissionBanque), barre empilee, taux remboursement global                |
| 6. Notification email pour chaque pret            | 3/3    | Complete  | SMTP nodemailer, template dark HTML, auto-envoi + renvoi manuel               |
| **Total**                                        | **20** | **20/20** |                                                                                |

## Fonctionnalites

- **Clients** : Creation, modification, suppression (cascade), recherche LIKE SQL debounced
- **Virements** : Execution avec validation de solde, annulation avec restauration, generation PDF
- **Prets** : Octroi avec commission 10%, notification email automatique, renvoi manuel, annulation, filtrage par situation
- **Remboursements** : Enregistrement avec mise a jour automatique de la situation, annulation, filtrage par pret
- **Benefice** : Visualisation du cumul des commissions, barre empilee capital/commission, taux de remboursement global
- **Dashboard** : 4 StatCards, derniers virements, prets en cours, activite du jour, top clients
- **Parametres** : Configuration SMTP, test connexion, test envoi, dossier PDF, stats base, securite
- **Base de donnees** : SQLite WAL + foreign_keys, transactions ACID, seed initial

## Regenerer l'icone

L'icone par defaut d'Electron est remplacee par une feuille verte
personnalisee. Pour la regenerer :

```bash
npm run build:icon    # Genere les PNG + .ico Windows
```

## Licence

Projet academique.
