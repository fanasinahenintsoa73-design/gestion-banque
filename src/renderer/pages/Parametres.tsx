import { useEffect, useState } from "react";
import {
  Mail,
  Check,
  X,
  RefreshCw,
  Send,
  Server,
  FileText,
  Shield,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import type { EmailConfig } from "@shared/types";

export default function Parametres() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [testConnexionEnCours, setTestConnexionEnCours] = useState(false);
  const [resultatTest, setResultatTest] = useState<{
    succes: boolean;
    message: string;
  } | null>(null);

  const [destinataire, setDestinataire] = useState("");
  const [envoiTestEnCours, setEnvoiTestEnCours] = useState(false);
  const [resultatEnvoi, setResultatEnvoi] = useState<{
    succes: boolean;
    message: string;
  } | null>(null);

  const [dossierPdf, setDossierPdf] = useState<string>("");

  const charger = async () => {
    const [c, d] = await Promise.all([
      window.api.email.config(),
      window.api.pdf.dossierSortie(),
    ]);
    setConfig(c);
    setDossierPdf(d);
  };

  useEffect(() => {
    charger();
  }, []);

  const testerConnexion = async () => {
    setTestConnexionEnCours(true);
    setResultatTest(null);
    try {
      const r = await window.api.email.testerConnexion();
      if (r.succes) {
        setResultatTest({
          succes: true,
          message:
            "Connexion SMTP reussie. Le serveur a accepte les identifiants.",
        });
      } else {
        setResultatTest({
          succes: false,
          message: r.erreur || "Echec de la connexion",
        });
      }
    } finally {
      setTestConnexionEnCours(false);
    }
  };

  const rechargerConfig = async () => {
    await window.api.email.recharger();
    await charger();
    setResultatTest({
      succes: true,
      message: "Configuration rechargee depuis le fichier .env",
    });
  };

  const envoyerTest = async () => {
    if (!destinataire) {
      setResultatEnvoi({
        succes: false,
        message: "Veuillez saisir une adresse destinataire",
      });
      return;
    }

    setEnvoiTestEnCours(true);
    setResultatEnvoi(null);
    try {
      const r = await window.api.email.envoyerTest(destinataire);
      if (r.succes) {
        setResultatEnvoi({
          succes: true,
          message: `Email de test envoye a ${destinataire}. Verifiez la boite de reception (et les spams).`,
        });
        setDestinataire("");
      } else {
        setResultatEnvoi({
          succes: false,
          message: r.erreur || "Echec de l'envoi",
        });
      }
    } finally {
      setEnvoiTestEnCours(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parametres</h1>
        <p className="text-sm text-textSecondary mt-1">
          Configuration de l'application et tests
        </p>
      </div>

      <Card>
        <CardHeader
          titre="Configuration email (SMTP)"
          sousTitre="Source: fichier .env a la racine du projet"
          action={
            <div className="flex items-center gap-2">
              {config?.configure ? (
                <Badge variante="succes">
                  <Check size={12} className="mr-1" />
                  Configure
                </Badge>
              ) : (
                <Badge variante="erreur">
                  <X size={12} className="mr-1" />
                  Non configure
                </Badge>
              )}
            </div>
          }
        />

        <div className="space-y-4">
          {config?.configure ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bgElevated rounded-md">
                <p className="text-xs uppercase tracking-wider text-textSecondary font-bold mb-1">
                  Serveur SMTP
                </p>
                <p className="text-sm font-mono text-textPrimary flex items-center gap-2">
                  <Server size={14} className="text-textSecondary" />
                  {config.host}:{config.port}
                </p>
              </div>
              <div className="p-4 bg-bgElevated rounded-md">
                <p className="text-xs uppercase tracking-wider text-textSecondary font-bold mb-1">
                  Utilisateur
                </p>
                <p className="text-sm font-mono text-textPrimary flex items-center gap-2">
                  <Mail size={14} className="text-textSecondary" />
                  {config.user}
                </p>
              </div>
            </div>
          ) : (
            <Alert variante="erreur" titre="Configuration SMTP manquante">
              <p className="text-sm">
                Creez ou editez le fichier{" "}
                <code className="font-mono bg-bgBase px-2 py-0.5 rounded">
                  .env
                </code>{" "}
                a la racine du projet avec les variables suivantes:
              </p>
              <pre className="mt-2 text-xs font-mono bg-bgBase p-3 rounded overflow-x-auto">
{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=votre.email@gmail.com
SMTP_PASS=mot_de_passe_application_16_caracteres`}
              </pre>
              <p className="text-xs mt-2">
                Pour Gmail, creez un mot de passe d'application sur:{" "}
                <span className="font-mono">
                  myaccount.google.com/apppasswords
                </span>
              </p>
            </Alert>
          )}

          {resultatTest && (
            <Alert
              variante={resultatTest.succes ? "succes" : "erreur"}
              fermable
              onFermer={() => setResultatTest(null)}
            >
              {resultatTest.message}
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              taille="sm"
              variante="primaire"
              iconeGauche={<Check size={14} />}
              onClick={testerConnexion}
              charge={testConnexionEnCours}
              disabled={!config?.configure}
            >
              Tester la connexion
            </Button>
            <Button
              taille="sm"
              variante="contour"
              iconeGauche={<RefreshCw size={14} />}
              onClick={rechargerConfig}
            >
              Recharger la config
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          titre="Envoi d'email de test"
          sousTitre="Testez l'envoi reel d'un email a n'importe quelle adresse"
        />

        <div className="space-y-4">
          <Input
            label="Adresse destinataire"
            type="email"
            placeholder="destinataire@exemple.com"
            value={destinataire}
            onChange={(e) => setDestinataire(e.target.value)}
            texteAide="L'email contient un simple message de test"
          />

          {resultatEnvoi && (
            <Alert
              variante={resultatEnvoi.succes ? "succes" : "erreur"}
              fermable
              onFermer={() => setResultatEnvoi(null)}
            >
              {resultatEnvoi.message}
            </Alert>
          )}

          <Button
            variante="primaire"
            iconeGauche={<Send size={14} />}
            onClick={envoyerTest}
            charge={envoiTestEnCours}
            disabled={!config?.configure}
          >
            Envoyer l'email de test
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          titre="Dossier de sortie des PDF"
          sousTitre="Ou sont sauvegardes les avis de virement"
          action={<FileText size={18} className="text-textSecondary" />}
        />
        <div className="space-y-3">
          <div className="p-3 bg-bgElevated rounded-md">
            <p className="text-xs text-textSecondary mb-1 font-bold uppercase tracking-wider">
              Chemin
            </p>
            <p className="text-sm font-mono text-textPrimary break-all">
              {dossierPdf || "Chargement..."}
            </p>
          </div>
          <Alert variante="info">
            Les fichiers PDF des avis de virement sont automatiquement generes
            dans ce dossier et ouverts dans le viewer systeme.
          </Alert>
        </div>
      </Card>

      <Card>
        <CardHeader
          titre="Securite"
          action={<Shield size={18} className="text-textSecondary" />}
        />
        <div className="space-y-3">
          <Alert variante="info">
            <p className="font-semibold mb-1">Fichier .env</p>
            <p className="text-sm">
              Les identifiants SMTP sont stockes dans le fichier .env a la
              racine du projet. Ce fichier ne doit jamais etre versionne (deja
              dans .gitignore).
            </p>
          </Alert>
          <Alert variante="avertissement">
            <p className="font-semibold mb-1">Mot de passe d'application Google</p>
            <p className="text-sm">
              Pour Gmail, utilisez un mot de passe d'application (16
              caracteres), PAS votre mot de passe principal. Generation sur
              myaccount.google.com/apppasswords (necessite la double
              authentification).
            </p>
          </Alert>
        </div>
      </Card>
    </div>
  );
}
