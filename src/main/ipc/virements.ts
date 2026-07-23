import { ipcMain } from "electron";
import {
  listerVirements,
  listerVirementsDetails,
  executerVirement,
  supprimerVirement,
} from "../dao/virementDao";
import type { Resultat } from "../../shared/types";

export function enregistrerHandlersVirements(): void {
  ipcMain.handle("virements:lister", () => listerVirements());

  ipcMain.handle("virements:listerDetails", () => listerVirementsDetails());

  ipcMain.handle(
    "virements:executer",
    (
      _e,
      numCompteEmetteur: string,
      numCompteBeneficiaire: string,
      montant: number,
      dateTransfert: string
    ): Resultat<unknown> => {
      try {
        if (!numCompteEmetteur || !numCompteBeneficiaire) {
          return { succes: false, erreur: "Comptes obligatoires" };
        }
        if (!dateTransfert) {
          return { succes: false, erreur: "Date obligatoire" };
        }

        const resultat = executerVirement(
          numCompteEmetteur,
          numCompteBeneficiaire,
          montant,
          dateTransfert
        );

        return { succes: true, data: resultat };
      } catch (e) {
        return { succes: false, erreur: String(e instanceof Error ? e.message : e) };
      }
    }
  );

  ipcMain.handle(
    "virements:supprimer",
    (_e, id: number): Resultat<null> => {
      try {
        const changes = supprimerVirement(id);
        if (changes === 0) {
          return { succes: false, erreur: "Virement introuvable" };
        }
        return { succes: true, data: null };
      } catch (e) {
        return { succes: false, erreur: String(e instanceof Error ? e.message : e) };
      }
    }
  );
}
