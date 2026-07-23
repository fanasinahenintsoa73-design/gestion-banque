import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  HandCoins,
  Trash2,
  TrendingUp,
  CircleDollarSign,
  Users,
  Filter,
  Mail,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { StatCard } from "@/components/ui/StatCard";
import { PretForm } from "@/components/forms/PretForm";
import { formatMontant, formatDate } from "@/lib/utils";
import { calculerCommission } from "@/lib/validations";
import type { Client, PretDetails, BeneficeBanque } from "@shared/types";

type FiltreSituation =
  | "Tous"
  | "Tout paye"
  | "Paye une part"
  | "Aucun remboursement";

export default function Prets() {
  const [clients, setClients] = useState<Client[]>([]);
  const [prets, setPrets] = useState<PretDetails[]>([]);
  const [benefice, setBenefice] = useState<BeneficeBanque | null>(null);
  const [chargement, setChargement] = useState(true);
  const [modalCreer, setModalCreer] = useState(false);
  const [modalSupprimer, setModalSupprimer] = useState(false);
  const [pretASupprimer, setPretASupprimer] = useState<PretDetails | null>(null);
  const [filtre, setFiltre] = useState<FiltreSituation>("Tous");
  const [alerte, setAlerte] = useState<{
    type: "succes" | "erreur" | "avertissement";
    message: string;
  } | null>(null);
  const [emailEnCours, setEmailEnCours] = useState(false);

  const charger = async () => {
    setChargement(true);
    try {
      const [c, p, b] = await Promise.all([
        window.api.clients.lister(),
        window.api.prets.listerDetails(),
        window.api.prets.beneficeCumule(),
      ]);
      setClients(c);
      setPrets(p);
      setBenefice(b);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const pretsFiltres = useMemo(() => {
    if (filtre === "Tous") return prets;
    return prets.filter((p) => p.situation === filtre);
  }, [prets, filtre]);

  const pretsParSituation = useMemo(
    () => ({
      "Tout paye": prets.filter((p) => p.situation === "Tout paye").length,
      "Paye une part": prets.filter((p) => p.situation === "Paye une part").length,
      "Aucun remboursement": prets.filter(
        (p) => p.situation === "Aucun remboursement"
      ).length,
    }),
    [prets]
  );

  const sendNotification = async (
    numPret: number,
    alerteSucces: string,
    alerteEchec: string
  ) => {
    setEmailEnCours(true);
    try {
      const r = await window.api.email.notifierPret(numPret);
      if (r.succes) {
        setAlerte({ type: "succes", message: `${alerteSucces} ${r.data.destinataire}` });
      } else {
        setAlerte({ type: "avertissement", message: `${alerteEchec} ${r.erreur}` });
      }
    } catch (e) {
      setAlerte({ type: "avertissement", message: `${alerteEchec} ${String(e)}` });
    } finally {
      setEmailEnCours(false);
    }
  };

  const creer = async (
    numCompte: string,
    montant: number,
    date: string
  ) => {
    const r = await window.api.prets.executer(numCompte, montant, date);
    if (r.succes && r.data) {
      const data = r.data as { pret: { numPret: number } };
      const numPret = data.pret.numPret;
      const net = montant - calculerCommission(montant);
      setModalCreer(false);
      charger();

      await sendNotification(
        numPret,
        `Pret #${numPret} octroye (net: ${formatMontant(net)}). Email envoye a`,
        `Pret #${numPret} octroye (net: ${formatMontant(net)}). Email non envoye:`
      );
    }
    return r;
  };

  const renvoyerNotification = async (numPret: number) => {
    await sendNotification(
      numPret,
      `Notification renvoyee a`,
      `Echec envoi notification ${numPret}:`
    );
  };

  const ouvrirSupprimer = (p: PretDetails) => {
    setPretASupprimer(p);
    setModalSupprimer(true);
  };

  const supprimer = async () => {
    if (!pretASupprimer) return;
    const r = await window.api.prets.supprimer(pretASupprimer.numPret);
    if (r.succes) {
      setAlerte({ type: "succes", message: "Pret annule, solde restitue" });
      setModalSupprimer(false);
      setPretASupprimer(null);
      charger();
    } else {
      setAlerte({ type: "erreur", message: r.erreur });
    }
  };

  const situationColor = (s: PretDetails["situation"]) => {
    switch (s) {
      case "Tout paye":
        return "succes" as const;
      case "Paye une part":
        return "avertissement" as const;
      case "Aucun remboursement":
        return "erreur" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prets</h1>
          <p className="text-sm text-textSecondary mt-1">
            Octroi et suivi des prets - Commission 10% - Notification email automatique
          </p>
        </div>
        <Button
          variante="primaire"
          iconeGauche={<Plus size={14} />}
          onClick={() => setModalCreer(true)}
        >
          Octroyer un pret
        </Button>
      </div>

      {alerte && (
        <Alert variante={alerte.type} fermable onFermer={() => setAlerte(null)}>
          {alerte.message}
        </Alert>
      )}

      {emailEnCours && (
        <div className="bg-info/10 border-l-2 border-info text-info p-3 rounded-md flex items-center gap-2 text-sm">
          <span className="inline-block w-4 h-4 border-2 border-info border-t-transparent rounded-full animate-spin" />
          Envoi de la notification email en cours...
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          titre="Benefice cumule"
          valeur={benefice ? formatMontant(benefice.totalCommissions) : "..."}
          icone={TrendingUp}
          sousTexte="commissions 10%"
          variation="banque"
          varianteVariation="positive"
        />
        <StatCard
          titre="Nombre de prets"
          valeur={prets.length}
          icone={HandCoins}
        />
        <StatCard
          titre="Montant total prete"
          valeur={benefice ? formatMontant(benefice.montantTotalPrete) : "..."}
          icone={CircleDollarSign}
        />
        <StatCard
          titre="Reste a rembourser"
          valeur={formatMontant(
            prets.reduce((s, p) => s + p.resteARembourser, 0)
          )}
          icone={Users}
          sousTexte={`${
            prets.filter((p) => p.situation !== "Tout paye").length
          } en cours`}
        />
      </div>

      <Card>
        <CardHeader
          titre="Repartition par situation"
          action={<Filter size={18} className="text-textSecondary" />}
        />
        <div className="grid grid-cols-3 gap-3">
          {(
            ["Tout paye", "Paye une part", "Aucun remboursement"] as const
          ).map((sit) => {
            const count = pretsParSituation[sit];
            const total = prets.length || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <button
                key={sit}
                onClick={() =>
                  setFiltre(filtre === sit ? "Tous" : (sit as FiltreSituation))
                }
                className={`p-4 rounded-lg text-left transition-colors ${
                  filtre === sit
                    ? "bg-bgElevated ring-1 ring-accent"
                    : "bg-bgElevated hover:bg-bgCard"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variante={situationColor(sit)}>{sit}</Badge>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="w-full bg-bgCard rounded-full h-1.5 overflow-hidden">
                  <div
                    className={
                      sit === "Tout paye"
                        ? "h-full bg-accent"
                        : sit === "Paye une part"
                          ? "h-full bg-warning"
                          : "h-full bg-error"
                    }
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-textSecondary mt-2">
                  {pct}% des prets
                </p>
              </button>
            );
          })}
        </div>
        {filtre !== "Tous" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-textSecondary">Filtre actif:</span>
            <Badge variante="info">{filtre}</Badge>
            <button
              onClick={() => setFiltre("Tous")}
              className="text-xs text-accent hover:underline"
            >
              Reinitialiser
            </button>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          titre="Liste des prets"
          action={
            <div className="flex items-center gap-2">
              <Badge>{pretsFiltres.length}</Badge>
              {filtre !== "Tous" && (
                <Badge variante="info">filtre: {filtre}</Badge>
              )}
            </div>
          }
        />
        {chargement ? (
          <p className="text-sm text-textSecondary text-center py-8">
            Chargement...
          </p>
        ) : pretsFiltres.length === 0 ? (
          <EmptyState
            titre={
              filtre !== "Tous"
                ? "Aucun pret dans cette situation"
                : "Aucun pret"
            }
            description={
              filtre === "Tous"
                ? "Octroyez votre premier pret pour commencer."
                : undefined
            }
            action={
              filtre === "Tous" && (
                <Button
                  taille="sm"
                  variante="primaire"
                  iconeGauche={<Plus size={14} />}
                  onClick={() => setModalCreer(true)}
                >
                  Octroyer un pret
                </Button>
              )
            }
          />
        ) : (
          <Table
            donnees={pretsFiltres}
            clePrimaire="numPret"
            colonnes={[
              {
                cle: "numPret",
                libelle: "Pret",
                largeur: "100px",
                rendu: (p) => (
                  <span className="font-mono font-bold">#{p.numPret}</span>
                ),
              },
              {
                cle: "client",
                libelle: "Client",
                rendu: (p) => (
                  <div>
                    <p className="font-semibold text-sm">
                      {p.nomClient} {p.prenomClient}
                    </p>
                    <p className="text-xs text-textSecondary font-mono">
                      {p.numCompte}
                    </p>
                  </div>
                ),
              },
              {
                cle: "montantPret",
                libelle: "Montant prete",
                alignement: "droite",
                rendu: (p) => (
                  <span className="font-semibold">
                    {formatMontant(p.montantPret)}
                  </span>
                ),
              },
              {
                cle: "commissionBanque",
                libelle: "Commission",
                alignement: "droite",
                rendu: (p) => (
                  <span className="font-semibold text-warning">
                    {formatMontant(p.commissionBanque)}
                  </span>
                ),
              },
              {
                cle: "totalRembourse",
                libelle: "Rembourse",
                alignement: "droite",
                rendu: (p) => (
                  <span className="text-accent font-semibold">
                    {formatMontant(p.totalRembourse)}
                  </span>
                ),
              },
              {
                cle: "resteARembourser",
                libelle: "Reste",
                alignement: "droite",
                rendu: (p) => (
                  <span className="text-error font-bold">
                    {formatMontant(p.resteARembourser)}
                  </span>
                ),
              },
              {
                cle: "situation",
                libelle: "Situation",
                rendu: (p) => (
                  <Badge variante={situationColor(p.situation)}>
                    {p.situation}
                  </Badge>
                ),
              },
              {
                cle: "datePret",
                libelle: "Date",
                rendu: (p) => (
                  <span className="text-xs text-textSecondary">
                    {formatDate(p.datePret)}
                  </span>
                ),
              },
              {
                cle: "actions",
                libelle: "",
                alignement: "droite",
                rendu: (p) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => renvoyerNotification(p.numPret)}
                      disabled={emailEnCours}
                      className="w-8 h-8 rounded-full hover:bg-bgElevated flex items-center justify-center text-textSecondary hover:text-accent transition-colors disabled:opacity-30"
                      title="Renvoyer la notification email"
                    >
                      <Mail size={14} />
                    </button>
                    <button
                      onClick={() => ouvrirSupprimer(p)}
                      className="w-8 h-8 rounded-full hover:bg-bgElevated flex items-center justify-center text-textSecondary hover:text-error transition-colors"
                      title="Annuler le pret"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        ouvert={modalCreer}
        onFermer={() => setModalCreer(false)}
        titre="Octroyer un nouveau pret"
        description="Une notification email sera envoyee automatiquement au client"
        taille="md"
      >
        <PretForm
          clients={clients}
          onSoumettre={creer}
          onAnnuler={() => setModalCreer(false)}
        />
      </Modal>

      <Modal
        ouvert={modalSupprimer}
        onFermer={() => {
          setModalSupprimer(false);
          setPretASupprimer(null);
        }}
        titre="Annuler le pret"
        taille="sm"
      >
        <div className="space-y-3">
          <Alert
            variante="avertissement"
            titre="Le solde du client sera restitue"
          >
            Cette action est irreversible. Les remboursements lies seront
            supprimes.
          </Alert>
          {pretASupprimer && (
            <div className="bg-bgElevated rounded-md p-3 text-sm space-y-1">
              <p>
                <span className="text-textSecondary">Pret:</span>{" "}
                <span className="font-mono">#{pretASupprimer.numPret}</span>
              </p>
              <p>
                <span className="text-textSecondary">Client:</span>{" "}
                {pretASupprimer.nomClient} {pretASupprimer.prenomClient}
              </p>
              <p>
                <span className="text-textSecondary">Montant:</span>{" "}
                <span className="font-bold">
                  {formatMontant(pretASupprimer.montantPret)}
                </span>
              </p>
              <p>
                <span className="text-textSecondary">Commission:</span>{" "}
                <span className="font-bold text-warning">
                  {formatMontant(pretASupprimer.commissionBanque)}
                </span>
              </p>
              <p>
                <span className="text-textSecondary">Reste:</span>{" "}
                <span
                  className={`font-bold ${
                    pretASupprimer.resteARembourser > 0
                      ? "text-error"
                      : "text-accent"
                  }`}
                >
                  {formatMontant(pretASupprimer.resteARembourser)}
                </span>
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button
            variante="fantome"
            onClick={() => {
              setModalSupprimer(false);
              setPretASupprimer(null);
            }}
          >
            Annuler
          </Button>
          <Button
            variante="danger"
            iconeGauche={<Trash2 size={14} />}
            onClick={supprimer}
          >
            Confirmer l'annulation
          </Button>
        </div>
      </Modal>
    </div>
  );
}
