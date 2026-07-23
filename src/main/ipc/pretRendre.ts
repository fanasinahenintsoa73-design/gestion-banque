import { ipcMain } from "electron";
import {
  listerPrets,
  listerPretsDetails,
  executerPret,
  supprimerPret,
  beneficeCumuleBanque,
  pretsParSituation,
} from "../dao/pretDao";
import {
  listerRemboursements,
  listerRemboursementsParPret,
  executerRemboursement,
  supprimerRemboursement,
} from "../dao/rendreDao";
import type { Resultat } from "../../shared/types";

export function enregistrerHandlersPretRendre(): void {
  ipcMain.handle("prets:lister", () => listerPrets());
  ipcMain.handle("prets:listerDetails", () => listerPretsDetails());

  ipcMain.handle(
    "prets:executer",
    (_e, numCompte: string, montant: number, date: string): Resultat<unknown> => {
      try {
        const r = executerPret(numCompte, montant, date);
        return { succes: true, data: r };
      } catch (e) {
        return { succes: false, erreur: String(e instanceof Error ? e.message : e) };
      }
    }
  );

  ipcMain.handle("prets:supprimer", (_e, numPret: number): Resultat<null> => {
    try {
      const c = supprimerPret(numPret);
      if (c === 0) return { succes: false, erreur: "Pret introuvable" };
      return { succes: true, data: null };
    } catch (e) {
      return { succes: false, erreur: String(e instanceof Error ? e.message : e) };
    }
  });

  ipcMain.handle("prets:beneficeCumule", () => beneficeCumuleBanque());
  ipcMain.handle("prets:parSituation", () => pretsParSituation());

  ipcMain.handle("rendus:lister", () => listerRemboursements());
  ipcMain.handle("rendus:parPret", (_e, numPret: number) =>
    listerRemboursementsParPret(numPret)
  );

  ipcMain.handle(
    "rendus:executer",
    (_e, numPret: number, restPaye: number, date: string): Resultat<unknown> => {
      try {
        const r = executerRemboursement(numPret, restPaye, date);
        return { succes: true, data: r };
      } catch (e) {
        return { succes: false, erreur: String(e instanceof Error ? e.message : e) };
      }
    }
  );

  ipcMain.handle("rendus:supprimer", (_e, numRendu: number): Resultat<null> => {
    try {
      const c = supprimerRemboursement(numRendu);
      if (c === 0) return { succes: false, erreur: "Remboursement introuvable" };
      return { succes: true, data: null };
    } catch (e) {
      return { succes: false, erreur: String(e instanceof Error ? e.message : e) };
    }
  });
}
