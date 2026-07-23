export interface Client {
  numCompte: string;
  nom: string;
  prenoms: string;
  tel: string;
  mail: string;
  solde: number;
}

export interface Virement {
  id: number;
  numCompteEmetteur: string;
  numCompteBeneficiaire: string;
  montant: number;
  dateTransfert: string;
}

export interface VirementDetails extends Virement {
  nomEmetteur: string;
  prenomEmetteur: string;
  nomBeneficiaire: string;
  prenomBeneficiaire: string;
  soldeEmetteurApres: number;
  soldeBeneficiaireApres: number;
}

export interface Pret {
  numPret: number;
  numCompte: string;
  montantPret: number;
  commissionBanque: number;
  datePret: string;
}

export interface PretDetails extends Pret {
  nomClient: string;
  prenomClient: string;
  mailClient: string;
  totalRembourse: number;
  resteARembourser: number;
  situation: "Tout paye" | "Paye une part" | "Aucun remboursement";
}

export interface Rendre {
  numRendu: number;
  numPret: number;
  situation: "Tout paye" | "Paye une part";
  restPaye: number;
  dateRendu: string;
}

export interface DbStats {
  clients: number;
  virements: number;
  prets: number;
  rendus: number;
}

export interface BeneficeBanque {
  totalCommissions: number;
  nombrePrets: number;
  montantTotalPrete: number;
}

export type Resultat<T> =
  | { succes: true; data: T }
  | { succes: false; erreur: string };

export interface ClientsApi {
  lister: () => Promise<Client[]>;
  obtenir: (numCompte: string) => Promise<Client | null>;
  creer: (client: Client) => Promise<Resultat<Client>>;
  modifier: (numCompte: string, client: Client) => Promise<Resultat<Client>>;
  supprimer: (numCompte: string) => Promise<Resultat<null>>;
  rechercher: (terme: string) => Promise<Client[]>;
}

export interface VirementsApi {
  lister: () => Promise<Virement[]>;
  listerDetails: () => Promise<VirementDetails[]>;
  executer: (
    emetteur: string,
    beneficiaire: string,
    montant: number,
    date: string
  ) => Promise<Resultat<unknown>>;
  supprimer: (id: number) => Promise<Resultat<null>>;
}

export interface PretsApi {
  lister: () => Promise<Pret[]>;
  listerDetails: () => Promise<PretDetails[]>;
  executer: (
    numCompte: string,
    montant: number,
    date: string
  ) => Promise<Resultat<unknown>>;
  supprimer: (numPret: number) => Promise<Resultat<null>>;
  beneficeCumule: () => Promise<BeneficeBanque>;
  parSituation: () => Promise<Record<string, number>>;
}

export interface RendusApi {
  lister: () => Promise<Rendre[]>;
  parPret: (numPret: number) => Promise<Rendre[]>;
  executer: (
    numPret: number,
    restPaye: number,
    date: string
  ) => Promise<Resultat<unknown>>;
  supprimer: (numRendu: number) => Promise<Resultat<null>>;
}

export interface PdfApi {
  genererAvisVirement: (
    id: number,
    nomBanque: string
  ) => Promise<Resultat<{ chemin: string }>>;
  ouvrir: (chemin: string) => Promise<void>;
  dossierSortie: () => Promise<string>;
}

export interface EmailConfig {
  configure: boolean;
  host?: string;
  port?: number;
  user?: string;
  erreur?: string;
}

export interface EmailApi {
  config: () => Promise<EmailConfig>;
  recharger: () => Promise<{ succes: boolean }>;
  testerConnexion: () => Promise<Resultat<null>>;
  envoyerTest: (
    destinataire: string
  ) => Promise<Resultat<{ messageId?: string }>>;
  notifierPret: (
    numPret: number
  ) => Promise<Resultat<{ destinataire: string }>>;
}

export interface ApiInterface {
  ping: () => Promise<string>;
  db: {
    ping: () => Promise<string>;
    stats: () => Promise<DbStats>;
  };
  clients: ClientsApi;
  virements: VirementsApi;
  prets: PretsApi;
  rendus: RendusApi;
  pdf: PdfApi;
  email: EmailApi;
}

declare global {
  interface Window {
    api: ApiInterface;
  }
}
