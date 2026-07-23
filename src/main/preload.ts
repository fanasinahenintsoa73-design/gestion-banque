import { contextBridge, ipcRenderer } from "electron";
import type { ApiInterface, Client } from "../shared/types";

const api: ApiInterface = {
  ping: () => ipcRenderer.invoke("ping"),
  db: {
    ping: () => ipcRenderer.invoke("db:ping"),
    stats: () => ipcRenderer.invoke("db:stats"),
  },
  clients: {
    lister: () => ipcRenderer.invoke("clients:lister"),
    obtenir: (numCompte: string) =>
      ipcRenderer.invoke("clients:obtenir", numCompte),
    creer: (client: Client) =>
      ipcRenderer.invoke("clients:creer", client),
    modifier: (numCompte: string, client: Client) =>
      ipcRenderer.invoke("clients:modifier", numCompte, client),
    supprimer: (numCompte: string) =>
      ipcRenderer.invoke("clients:supprimer", numCompte),
    rechercher: (terme: string) =>
      ipcRenderer.invoke("clients:rechercher", terme),
  },
  virements: {
    lister: () => ipcRenderer.invoke("virements:lister"),
    listerDetails: () => ipcRenderer.invoke("virements:listerDetails"),
    executer: (emetteur, beneficiaire, montant, date) =>
      ipcRenderer.invoke("virements:executer", emetteur, beneficiaire, montant, date),
    supprimer: (id) => ipcRenderer.invoke("virements:supprimer", id),
  },
  prets: {
    lister: () => ipcRenderer.invoke("prets:lister"),
    listerDetails: () => ipcRenderer.invoke("prets:listerDetails"),
    executer: (numCompte, montant, date) =>
      ipcRenderer.invoke("prets:executer", numCompte, montant, date),
    supprimer: (numPret) => ipcRenderer.invoke("prets:supprimer", numPret),
    beneficeCumule: () => ipcRenderer.invoke("prets:beneficeCumule"),
    parSituation: () => ipcRenderer.invoke("prets:parSituation"),
  },
  rendus: {
    lister: () => ipcRenderer.invoke("rendus:lister"),
    parPret: (numPret) => ipcRenderer.invoke("rendus:parPret", numPret),
    executer: (numPret, restPaye, date) =>
      ipcRenderer.invoke("rendus:executer", numPret, restPaye, date),
    supprimer: (numRendu) => ipcRenderer.invoke("rendus:supprimer", numRendu),
  },
  pdf: {
    genererAvisVirement: (id, nomBanque) =>
      ipcRenderer.invoke("pdf:genererAvisVirement", id, nomBanque),
    ouvrir: (chemin) => ipcRenderer.invoke("pdf:ouvrir", chemin),
    dossierSortie: () => ipcRenderer.invoke("pdf:dossierSortie"),
  },
  email: {
    config: () => ipcRenderer.invoke("email:config"),
    recharger: () => ipcRenderer.invoke("email:recharger"),
    testerConnexion: () => ipcRenderer.invoke("email:testerConnexion"),
    envoyerTest: (destinataire) =>
      ipcRenderer.invoke("email:envoyerTest", destinataire),
    notifierPret: (numPret) =>
      ipcRenderer.invoke("email:notifierPret", numPret),
  },
};

contextBridge.exposeInMainWorld("api", api);
