import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { app, shell } from "electron";
import type { Client, Virement } from "../../shared/types";

export interface DonneesAvis {
  virement: Virement;
  emetteur: Client;
  beneficiaire: Client;
  nomBanque: string;
  numeroVirement: string;
}

function formatNombre(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function genererAvisVirement(donnees: DonneesAvis): Promise<string> {
  const { virement, emetteur, beneficiaire, nomBanque, numeroVirement } = donnees;

  const documentsPath = app.getPath("documents");
  const dossierSortie = path.join(documentsPath, "Banque-Avis");

  if (!fs.existsSync(dossierSortie)) {
    fs.mkdirSync(dossierSortie, { recursive: true });
  }

  const nomFichier = `avis-virement-${numeroVirement}-${Date.now()}.pdf`;
  const cheminComplet = path.join(dossierSortie, nomFichier);

  const soldeApresEmetteur = emetteur.solde;
  const soldeApresBeneficiaire = beneficiaire.solde;
  const dateFormatee = new Date(virement.dateTransfert).toLocaleDateString("fr-FR");
  const montantFormate = formatNombre(virement.montant) + " Ar";

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: `Avis de virement N°${numeroVirement}`,
      Author: nomBanque,
    },
  });

  const stream = fs.createWriteStream(cheminComplet);
  doc.pipe(stream);

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#121212")
    .text(nomBanque, { align: "center" });

  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#4d4d4d")
    .text(`Date : ${dateFormatee}`, { align: "center" });

  doc.moveDown(1);

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#1ed760")
    .text(`AVIS DE VIREMENT N°${numeroVirement}`, { align: "center" });

  doc.moveDown(0.3);

  doc
    .strokeColor("#1ed760")
    .lineWidth(1)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();

  doc.moveDown(1.5);

  doc.fillColor("#121212").font("Helvetica-Bold").fontSize(11);
  doc.text("EMETTEUR");
  doc.font("Helvetica").fontSize(11);
  doc.text(`N° de compte : ${emetteur.numCompte}`);
  doc.text(`${emetteur.nom} ${emetteur.prenoms}`);
  doc.text(`Solde actuel : ${formatNombre(soldeApresEmetteur)} Ar`);

  doc.moveDown(1);

  doc.fillColor("#121212").font("Helvetica-Bold").fontSize(11);
  doc.text("BENEFICIAIRE");
  doc.font("Helvetica").fontSize(11);
  doc.text(`N° de compte : ${beneficiaire.numCompte}`);
  doc.text(`${beneficiaire.nom} ${beneficiaire.prenoms}`);
  doc.text(
    `Solde apres credit : ${formatNombre(soldeApresBeneficiaire)} Ar`
  );

  doc.moveDown(1.5);

  const boxY = doc.y;
  const boxHeight = 60;
  doc
    .rect(doc.page.margins.left, boxY, doc.page.width - doc.page.margins.left - doc.page.margins.right, boxHeight)
    .fillAndStroke("#1ed760", "#1ed760");

  doc
    .fillColor("#000000")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("MONTANT DU VIREMENT", doc.page.margins.left + 20, boxY + 12, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 40,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(montantFormate, doc.page.margins.left + 20, boxY + 32, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 40,
      align: "right",
    });

  doc.y = boxY + boxHeight + 20;

  doc.moveDown(2);
  doc
    .font("Helvetica-Oblique")
    .fontSize(9)
    .fillColor("#7c7c7c")
    .text(
      `Document genere automatiquement le ${new Date().toLocaleString("fr-FR")}`,
      { align: "center" }
    );

  doc.moveDown(0.5);
  doc.text(
    "Cet avis vaut preuve de l'operation. Conservez-le precieusement.",
    { align: "center" }
  );

  doc.moveDown(3);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#121212")
    .text("Signature de la banque", doc.page.margins.left, doc.y, {
      width: 200,
    });

  doc
    .text("Signature du beneficiaire", doc.page.width - doc.page.margins.right - 200, doc.y - 12, {
      width: 200,
      align: "right",
    });

  doc.moveDown(3);
  doc
    .strokeColor("#4d4d4d")
    .lineWidth(0.5)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + 200, doc.y)
    .stroke();
  doc.moveUp();
  doc
    .moveTo(doc.page.width - doc.page.margins.right - 200, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();

  doc.end();

  return new Promise<string>((resolve, reject) => {
    stream.on("finish", () => resolve(cheminComplet));
    stream.on("error", reject);
  });
}

export function ouvrirPDF(chemin: string): void {
  shell.openPath(chemin);
}
