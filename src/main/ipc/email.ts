import { ipcMain } from "electron";
import {
  testerConnexion,
  envoyerEmailTest,
  envoyerNotificationPret,
  obtenirConfig,
  chargerDotenv,
} from "../services/emailService";
import { obtenirClient } from "../dao/clientDao";
import { obtenirPret } from "../dao/pretDao";
import type { Resultat } from "../../shared/types";

export function enregistrerHandlersEmail(): void {
  ipcMain.handle("email:config", () => {
    const config = obtenirConfig();
    if (!config) {
      return { configure: false, erreur: "Fichier .env absent ou incomplet" };
    }
    return { configure: true, host: config.host, port: config.port, user: config.user };
  });

  ipcMain.handle("email:recharger", () => {
    chargerDotenv();
    return { succes: true };
  });

  ipcMain.handle("email:testerConnexion", () => testerConnexion());

  ipcMain.handle(
    "email:envoyerTest",
    (_e, destinataire: string): Promise<Resultat<{ messageId?: string }>> =>
      envoyerEmailTest(destinataire)
  );

  ipcMain.handle(
    "email:notifierPret",
    async (_e, numPret: number): Promise<Resultat<{ destinataire: string }>> => {
      try {
        const pret = obtenirPret(numPret);
        if (!pret) return { succes: false, erreur: "Pret introuvable" };

        const client = obtenirClient(pret.numCompte);
        if (!client) return { succes: false, erreur: "Client introuvable" };

        const datePret = new Date(pret.datePret);
        const echeance = new Date(datePret);
        echeance.setDate(echeance.getDate() + 30);
        const aujourdHui = new Date();
        const joursRestants = Math.max(
          0,
          Math.ceil(
            (echeance.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        const montantRestant = pret.montantPret - pret.commissionBanque;

        const result = await envoyerNotificationPret({
          client,
          pret,
          joursRestants,
          montantRestant,
          dateEcheance: echeance.toISOString().split("T")[0],
        });

        if (result.succes) {
          return { succes: true, data: { destinataire: client.mail } };
        }
        return { succes: false, erreur: result.erreur };
      } catch (e) {
        return {
          succes: false,
          erreur: `Erreur notification: ${e instanceof Error ? e.message : String(e)}`,
        };
      }
    }
  );
}
