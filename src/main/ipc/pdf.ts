import path from "path";
import { ipcMain, shell, app } from "electron";
import { genererAvisVirement } from "../services/pdfService";
import { obtenirVirement } from "../dao/virementDao";
import { obtenirClient } from "../dao/clientDao";
import type { Resultat } from "../../shared/types";

export function enregistrerHandlersPdf(): void {
  ipcMain.handle(
    "pdf:genererAvisVirement",
    async (
      _e,
      idVirement: number,
      nomBanque: string
    ): Promise<Resultat<{ chemin: string }>> => {
      try {
        const virement = obtenirVirement(idVirement);
        if (!virement) {
          return { succes: false, erreur: "Virement introuvable" };
        }

        const emetteur = obtenirClient(virement.numCompteEmetteur);
        const beneficiaire = obtenirClient(virement.numCompteBeneficiaire);

        if (!emetteur || !beneficiaire) {
          return { succes: false, erreur: "Client introuvable" };
        }

        const numeroVirement = String(idVirement).padStart(3, "0");
        const chemin = await genererAvisVirement({
          virement,
          emetteur,
          beneficiaire,
          nomBanque: nomBanque || "Banque Nationale",
          numeroVirement,
        });

        return { succes: true, data: { chemin } };
      } catch (e) {
        return {
          succes: false,
          erreur: String(e instanceof Error ? e.message : e),
        };
      }
    }
  );

  ipcMain.handle("pdf:ouvrir", (_e, chemin: string) => {
    shell.openPath(chemin);
  });

  ipcMain.handle("pdf:dossierSortie", () => {
    return path.join(app.getPath("documents"), "Banque-Avis");
  });
}
