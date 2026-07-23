import { ipcMain } from "electron";
import { getDatabase } from "../db/connection";
import {
  listerClients,
  obtenirClient,
  creerClient,
  modifierClient,
  supprimerClient,
  rechercherClients,
} from "../dao/clientDao";
import type { Client, Resultat } from "../../shared/types";

const REGEX_LETTRES = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
const REGEX_TEL = /^\+261\s\d{2}\s\d{2}\s\d{3}\s\d{2}$/;

function validerClient(client: Client, estCreation: boolean): string[] {
  const erreurs: string[] = [];

  if (estCreation && !client.numCompte.trim()) {
    erreurs.push("Le numero de compte est obligatoire");
  } else if (!/^\d+$/.test(client.numCompte)) {
    erreurs.push("Le numero de compte doit etre un nombre positif");
  } else {
    const num = parseInt(client.numCompte, 10);
    if (num <= 0) {
      erreurs.push("Le numero de compte doit etre un nombre positif");
    } else if (num > 1000000) {
      erreurs.push("Le numero de compte ne doit pas depasser 1 000 000");
    }
  }

  if (!client.nom.trim()) {
    erreurs.push("Le nom est obligatoire");
  } else if (!REGEX_LETTRES.test(client.nom.trim())) {
    erreurs.push("Le nom ne doit contenir que des lettres");
  }

  if (!client.prenoms.trim()) {
    erreurs.push("Le prenom est obligatoire");
  } else if (!REGEX_LETTRES.test(client.prenoms.trim())) {
    erreurs.push("Le prenom ne doit contenir que des lettres");
  }

  if (!client.tel.trim()) {
    erreurs.push("Le telephone est obligatoire");
  } else if (!REGEX_TEL.test(client.tel.trim())) {
    erreurs.push("Le telephone doit etre au format +261 XX XX XXX XX (9 chiffres)");
  }

  if (!client.mail.trim()) {
    erreurs.push("L'email est obligatoire");
  } else if (!client.mail.includes("@")) {
    erreurs.push("L'email doit contenir un @");
  }

  return erreurs;
}

export function enregistrerHandlersClients(): void {
  ipcMain.handle("clients:lister", () => listerClients());

  ipcMain.handle("clients:obtenir", (_e, numCompte: string) => {
    if (!numCompte) return null;
    return obtenirClient(numCompte);
  });

  ipcMain.handle("clients:creer", (_e, client: Client): Resultat<Client> => {
    try {
      const erreurs = validerClient(client, true);
      if (erreurs.length > 0) return { succes: false, erreur: erreurs.join("\n") };

      if (obtenirClient(client.numCompte)) {
        return { succes: false, erreur: "Ce numero de compte existe deja" };
      }

      const tx = getDatabase().transaction(() => creerClient(client));
      tx();

      return { succes: true, data: client };
    } catch (e) {
      return { succes: false, erreur: `Erreur creation : ${String(e)}` };
    }
  });

  ipcMain.handle(
    "clients:modifier",
    (_e, numCompte: string, client: Client): Resultat<Client> => {
      try {
        const erreurs = validerClient({ ...client, numCompte }, false);
        if (erreurs.length > 0) return { succes: false, erreur: erreurs.join("\n") };

        if (!obtenirClient(numCompte)) {
          return { succes: false, erreur: "Client introuvable" };
        }

        const final: Client = { ...client, numCompte };
        const tx = getDatabase().transaction(() => modifierClient(final));
        tx();

        return { succes: true, data: final };
      } catch (e) {
        return { succes: false, erreur: `Erreur modification : ${String(e)}` };
      }
    }
  );

  ipcMain.handle(
    "clients:supprimer",
    (_e, numCompte: string): Resultat<null> => {
      try {
        if (!obtenirClient(numCompte)) {
          return { succes: false, erreur: "Client introuvable" };
        }
        supprimerClient(numCompte);
        return { succes: true, data: null };
      } catch (e) {
        return { succes: false, erreur: `Erreur suppression : ${String(e)}` };
      }
    }
  );

  ipcMain.handle("clients:rechercher", (_e, terme: string) => {
    if (!terme || !terme.trim()) return listerClients();
    return rechercherClients(terme.trim());
  });
}
