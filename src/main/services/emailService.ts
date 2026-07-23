import nodemailer, { type Transporter } from "nodemailer";
import fs from "fs";
import path from "path";
import type { Client, Pret, Resultat } from "../../shared/types";

export interface ConfigSmtp {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

let transporteur: Transporter | null = null;
let configActuelle: ConfigSmtp | null = null;

export function chargerConfigDepuisEnv(): ConfigSmtp | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const secure = process.env.SMTP_SECURE;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  return {
    host,
    port: parseInt(port, 10) || 587,
    secure: secure === "true",
    user,
    pass,
  };
}

export function obtenirConfig(): ConfigSmtp | null {
  if (configActuelle) return configActuelle;
  configActuelle = chargerConfigDepuisEnv();
  return configActuelle;
}

export function obtenirTransporteur(): Transporter | null {
  if (transporteur) return transporteur;

  const config = obtenirConfig();
  if (!config) return null;

  transporteur = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });

  return transporteur;
}

export async function testerConnexion(): Promise<Resultat<null>> {
  const transport = obtenirTransporteur();
  if (!transport) {
    return {
      succes: false,
      erreur: "Configuration SMTP manquante (verifiez .env)",
    };
  }
  try {
    await transport.verify();
    return { succes: true, data: null };
  } catch (e) {
    return {
      succes: false,
      erreur: `Echec connexion SMTP: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

export async function envoyerEmailTest(
  destinataire: string
): Promise<Resultat<{ messageId?: string }>> {
  const transport = obtenirTransporteur();
  const config = obtenirConfig();
  if (!transport || !config) {
    return { succes: false, erreur: "Service email non configure" };
  }

  try {
    const info = await transport.sendMail({
      from: `"Banque Nationale" <${config.user}>`,
      to: destinataire,
      subject: "Test SMTP - Banque Nationale",
      text: "Configuration SMTP fonctionnelle.",
      html: "<h1>Test SMTP</h1><p>Configuration SMTP fonctionnelle.</p>",
    });
    return { succes: true, data: { messageId: info.messageId } };
  } catch (e) {
    return {
      succes: false,
      erreur: `Echec envoi: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

function genererTemplatePret(d: {
  client: Client;
  pret: Pret;
  dateEcheance: string;
  joursRestants: number;
  montantRestant: number;
}): { sujet: string; html: string; texte: string } {
  const fmt = (n: number) =>
    n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Ar";
  const dateFmt = (s: string) =>
    new Date(s).toLocaleDateString("fr-FR");

  const sujet = `Notification de pret N°${d.pret.numPret} - Banque Nationale`;
  const mFormate = fmt(d.pret.montantPret);
  const mrFormate = fmt(d.montantRestant);
  const dFormate = dateFmt(d.pret.datePret);
  const echeanceFormate = dateFmt(d.dateEcheance);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background-color:#121212;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff}
.container{max-width:600px;margin:0 auto;background-color:#181818;padding:32px}
.header{text-align:center;padding-bottom:24px;border-bottom:1px solid #4d4d4d}
.logo{display:inline-block;width:48px;height:48px;background-color:#1ed760;border-radius:50%;line-height:48px;text-align:center;color:#000;font-weight:bold;font-size:24px}
.title{font-size:24px;font-weight:bold;margin:16px 0 4px 0}
.subtitle{font-size:14px;color:#b3b3b3}
.content{padding:32px 0}
.greeting{font-size:16px;margin-bottom:24px}
.info-box{background-color:#1f1f1f;border-left:3px solid #1ed760;padding:20px 24px;margin:24px 0}
.info-row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px}
.info-label{color:#b3b3b3;text-transform:uppercase;letter-spacing:1.4px;font-size:11px;font-weight:bold}
.info-value{color:#fff;font-weight:600}
.info-value.highlight{color:#1ed760;font-size:18px}
.info-value.warning{color:#ffa42b}
.alert-box{background-color:#ffa42b20;border-left:3px solid #ffa42b;padding:16px 20px;margin:24px 0;color:#ffa42b;font-size:14px}
.footer{padding-top:24px;border-top:1px solid #4d4d4d;text-align:center;font-size:12px;color:#b3b3b3}
</style></head>
<body>
<div class="container">
<div class="header"><div class="logo">B</div><div class="title">Banque Nationale</div><div class="subtitle">Notification de pret</div></div>
<div class="content">
<p class="greeting">Bonjour ${d.client.prenoms} ${d.client.nom},</p>
<p style="font-size:14px;line-height:1.6;color:#cbcbcb;">Nous vous informons du statut de votre pret N°<strong>${d.pret.numPret}</strong>.</p>
<div class="info-box">
<div class="info-row"><span class="info-label">Numero de pret</span><span class="info-value">${d.pret.numPret}</span></div>
<div class="info-row"><span class="info-label">Montant emprunte</span><span class="info-value">${mFormate}</span></div>
<div class="info-row"><span class="info-label">Date du pret</span><span class="info-value">${dFormate}</span></div>
<div class="info-row"><span class="info-label">Date d'echeance</span><span class="info-value">${echeanceFormate}</span></div>
<div class="info-row"><span class="info-label">Jours restants</span><span class="info-value warning">${d.joursRestants} jour(s)</span></div>
<div class="info-row"><span class="info-label">Montant a rendre</span><span class="info-value highlight">${mrFormate}</span></div>
</div>
${d.joursRestants <= 7 ? `<div class="alert-box">Attention: votre pret arrive a echeance dans ${d.joursRestants} jour(s). Veuillez proceder au remboursement.</div>` : ""}
<p style="font-size:14px;line-height:1.6;color:#cbcbcb;">Pour toute question, contactez-nous en agence.</p>
</div>
<div class="footer"><p>Email automatique, merci de ne pas repondre.</p><p style="margin-top:8px;">Banque Nationale</p></div>
</div>
</body>
</html>`;

  const texte = `Bonjour ${d.client.prenoms} ${d.client.nom},

Nous vous informons du statut de votre pret N°${d.pret.numPret}.

- Montant: ${mFormate}
- Date: ${dFormate}
- Echeance: ${echeanceFormate}
- Jours restants: ${d.joursRestants} jour(s)
- Montant a rendre: ${mrFormate}

${d.joursRestants <= 7 ? "ATTENTION: votre pret arrive a echeance.\n" : ""}
Banque Nationale`;

  return { sujet, html, texte };
}

export interface ParametresNotificationPret {
  client: Client;
  pret: Pret;
  joursRestants: number;
  montantRestant: number;
  dateEcheance: string;
}

export async function envoyerNotificationPret(
  params: ParametresNotificationPret
): Promise<Resultat<{ messageId?: string }>> {
  const transport = obtenirTransporteur();
  const config = obtenirConfig();
  if (!transport || !config) {
    return { succes: false, erreur: "Service email non configure" };
  }

  const { sujet, html, texte } = genererTemplatePret(params);

  try {
    const info = await transport.sendMail({
      from: `"Banque Nationale" <${config.user}>`,
      to: params.client.mail,
      subject: sujet,
      text: texte,
      html,
    });
    console.log(`[email] Notification envoyee a ${params.client.mail} (${info.messageId})`);
    return { succes: true, data: { messageId: info.messageId } };
  } catch (e) {
    return {
      succes: false,
      erreur: `Echec envoi: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

export function chargerDotenv(): void {
  const candidats = [
    path.join(process.cwd(), ".env"),
    path.join(__dirname, "..", "..", "..", ".env"),
    path.join(__dirname, "..", "..", ".env"),
  ];

  for (const chemin of candidats) {
    if (!fs.existsSync(chemin)) continue;
    const contenu = fs.readFileSync(chemin, "utf-8");
    for (const ligne of contenu.split("\n")) {
      const t = ligne.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const cle = t.slice(0, eq).trim();
      const valeur = t.slice(eq + 1).trim();
      if (cle && !process.env[cle]) process.env[cle] = valeur;
    }
    console.log(`[email] .env charge depuis ${chemin}`);
    return;
  }
  console.warn("[email] Aucun fichier .env trouve");
}
