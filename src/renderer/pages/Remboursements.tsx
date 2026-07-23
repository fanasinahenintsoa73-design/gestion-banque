import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Receipt,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { StatCard } from "@/components/ui/StatCard";
import { Select } from "@/components/ui/Input";
import { RemboursementForm } from "@/components/forms/RemboursementForm";
import { formatMontant, formatDate } from "@/lib/utils";
import type { Rendre, PretDetails } from "@shared/types";

export default function Remboursements() {
  const [prets, setPrets] = useState<PretDetails[]>([]);
  const [remboursements, setRemboursements] = useState<Rendre[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalCreer, setModalCreer] = useState(false);
  const [modalSupprimer, setModalSupprimer] = useState(false);
  const [renduASupprimer, setRenduASupprimer] = useState<Rendre | null>(null);
  const [filtrePret, setFiltrePret] = useState<number | "">("");
  const [alerte, setAlerte] = useState<{
    type: "succes" | "erreur";
    message: string;
  } | null>(null);

  const charger = async () => {
    setChargement(true);
    try {
      const [p, r] = await Promise.all([
        window.api.prets.listerDetails(),
        window.api.rendus.lister(),
      ]);
      setPrets(p);
      setRemboursements(r);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const remboursementsFiltres = useMemo(() => {
    if (filtrePret === "") return remboursements;
    return remboursements.filter((r) => r.numPret === filtrePret);
  }, [remboursements, filtrePret]);

  const stats = useMemo(() => {
    const totalRembourse = remboursements.reduce((s, r) => s + r.restPaye, 0);
    const pretsSoldes = prets.filter((p) => p.situation === "Tout paye").length;
    const pretsEnCours = prets.filter(
      (p) => p.situation === "Paye une part"
    ).length;
    return {
      totalRembourse,
      nbRemboursements: remboursements.length,
      pretsSoldes,
      pretsEnCours,
    };
  }, [remboursements, prets]);

  const creer = async (
    numPret: number,
    restPaye: number,
    date: string
  ) => {
    const r = await window.api.rendus.executer(numPret, restPaye, date);
    if (r.succes) {
      setAlerte({
        type: "succes",
        message: `Remboursement de ${formatMontant(restPaye)} enregistre`,
      });
      setModalCreer(false);
      charger();
    }
    return r;
  };

  const ouvrirSupprimer = (r: Rendre) => {
    setRenduASupprimer(r);
    setModalSupprimer(true);
  };

  const supprimer = async () => {
    if (!renduASupprimer) return;
    const r = await window.api.rendus.supprimer(renduASupprimer.numRendu);
    if (r.succes) {
      setAlerte({ type: "succes", message: "Remboursement annule" });
      setModalSupprimer(false);
      setRenduASupprimer(null);
      charger();
    } else {
      setAlerte({ type: "erreur", message: r.erreur });
    }
  };

  const optionsFiltre = [
    { valeur: "", libelle: "Tous les prets" },
    ...prets.map((p) => ({
      valeur: String(p.numPret),
      libelle: `Pret #${p.numPret} - ${p.nomClient} ${p.prenomClient}`,
    })),
  ];

  const pretsEnCours = prets.filter(
    (p) => p.situation !== "Tout paye"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Remboursements</h1>
          <p className="text-sm text-textSecondary mt-1">
            Suivi des remboursements et situations des prets
          </p>
        </div>
        <Button
          variante="primaire"
          iconeGauche={<Plus size={14} />}
          onClick={() => setModalCreer(true)}
          disabled={pretsEnCours.length === 0}
        >
          Nouveau remboursement
        </Button>
      </div>

      {alerte && (
        <Alert variante={alerte.type} fermable onFermer={() => setAlerte(null)}>
          {alerte.message}
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          titre="Total rembourse"
          valeur={formatMontant(stats.totalRembourse)}
          icone={TrendingUp}
          variation="cumule"
          varianteVariation="positive"
        />
        <StatCard
          titre="Remboursements"
          valeur={stats.nbRemboursements}
          icone={Receipt}
        />
        <StatCard
          titre="Prets soldes"
          valeur={stats.pretsSoldes}
          icone={CheckCircle2}
          sousTexte="rembourses integralement"
        />
        <StatCard
          titre="Prets en cours"
          valeur={stats.pretsEnCours}
          icone={Clock}
          sousTexte="partiellement rembourses"
        />
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-bold text-textSecondary">
            Filtrer par pret:
          </span>
          <div className="flex-1 max-w-md">
            <Select
              value={filtrePret === "" ? "" : String(filtrePret)}
              onChange={(e) => setFiltrePret(e.target.value === "" ? "" : Number(e.target.value))}
              options={optionsFiltre}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          titre="Etat des prets"
          action={<Badge>{prets.length}</Badge>}
        />
        {prets.length === 0 ? (
          <EmptyState
            titre="Aucun pret"
            description="Octroyez d'abord un pret depuis la page Prets."
          />
        ) : (
          <div className="space-y-3">
            {prets.map((p) => {
              const pct =
                p.montantPret > 0
                  ? (p.totalRembourse / p.montantPret) * 100
                  : 0;
              return (
                <div
                  key={p.numPret}
                  className="p-4 bg-bgElevated rounded-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm font-mono">
                        #{p.numPret}
                      </span>
                      <span className="text-sm">
                        {p.nomClient} {p.prenomClient}
                      </span>
                      <Badge
                        variante={
                          p.situation === "Tout paye"
                            ? "succes"
                            : p.situation === "Paye une part"
                              ? "avertissement"
                              : "erreur"
                        }
                      >
                        {p.situation}
                      </Badge>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-textSecondary">
                        {formatMontant(p.totalRembourse)} /{" "}
                        {formatMontant(p.montantPret)}
                      </p>
                      <p className="font-bold text-accent">
                        {Math.round(pct)}% rembourse
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-bgCard rounded-full h-2 overflow-hidden">
                    <div
                      className={
                        p.situation === "Tout paye"
                          ? "h-full bg-accent"
                          : p.situation === "Paye une part"
                            ? "h-full bg-warning"
                            : "h-full bg-error"
                      }
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-textSecondary">
                      Reste:{" "}
                      <span className="text-error font-bold">
                        {formatMontant(p.resteARembourser)}
                      </span>
                    </span>
                    <button
                      onClick={() => setFiltrePret(String(p.numPret) === String(filtrePret) ? "" : p.numPret)}
                      className="text-accent hover:underline"
                    >
                      Voir les remboursements
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          titre="Historique des remboursements"
          action={
            <div className="flex items-center gap-2">
              {filtrePret !== "" && <Badge variante="info">Pret #{filtrePret}</Badge>}
              <Badge>{remboursementsFiltres.length}</Badge>
            </div>
          }
        />
        {chargement ? (
          <p className="text-sm text-textSecondary text-center py-8">
            Chargement...
          </p>
        ) : remboursementsFiltres.length === 0 ? (
          <EmptyState
            titre={
              filtrePret !== ""
                ? "Aucun remboursement pour ce pret"
                : "Aucun remboursement"
            }
            description={
              filtrePret
                ? undefined
                : "Le premier remboursement apparaitra ici."
            }
          />
        ) : (
          <Table
            donnees={remboursementsFiltres}
            clePrimaire="numRendu"
            colonnes={[
              {
                cle: "numRendu",
                libelle: "N°",
                largeur: "100px",
                rendu: (r) => (
                  <span className="font-mono font-bold">#{r.numRendu}</span>
                ),
              },
              {
                cle: "numPret",
                libelle: "Pret",
                rendu: (r) => {
                  const p = prets.find((x) => x.numPret === r.numPret);
                  return (
                    <div>
                      <p className="font-mono text-sm">#{r.numPret}</p>
                      {p && (
                        <p className="text-xs text-textSecondary">
                          {p.nomClient} {p.prenomClient} -{" "}
                          {formatMontant(p.montantPret)}
                        </p>
                      )}
                    </div>
                  );
                },
              },
              {
                cle: "restPaye",
                libelle: "Montant rembourse",
                alignement: "droite",
                rendu: (r) => (
                  <span className="font-bold text-accent">
                    {formatMontant(r.restPaye)}
                  </span>
                ),
              },
              {
                cle: "situation",
                libelle: "Situation resultante",
                alignement: "centre",
                rendu: (r) => (
                  <Badge
                    variante={
                      r.situation === "Tout paye" ? "succes" : "avertissement"
                    }
                  >
                    {r.situation}
                  </Badge>
                ),
              },
              {
                cle: "dateRendu",
                libelle: "Date",
                rendu: (r) => (
                  <span className="text-xs text-textSecondary">
                    {formatDate(r.dateRendu)}
                  </span>
                ),
              },
              {
                cle: "actions",
                libelle: "",
                alignement: "droite",
                rendu: (r) => (
                  <button
                    onClick={() => ouvrirSupprimer(r)}
                    className="w-8 h-8 rounded-full hover:bg-bgElevated flex items-center justify-center text-textSecondary hover:text-error transition-colors"
                    title="Annuler le remboursement"
                  >
                    <Trash2 size={14} />
                  </button>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        ouvert={modalCreer}
        onFermer={() => setModalCreer(false)}
        titre="Enregistrer un remboursement"
        description="La situation du pret sera mise a jour automatiquement"
        taille="md"
      >
        <RemboursementForm
          prets={prets}
          onSoumettre={creer}
          onAnnuler={() => setModalCreer(false)}
        />
      </Modal>

      <Modal
        ouvert={modalSupprimer}
        onFermer={() => {
          setModalSupprimer(false);
          setRenduASupprimer(null);
        }}
        titre="Annuler le remboursement"
        taille="sm"
      >
        <div className="space-y-3">
          <Alert
            variante="avertissement"
            titre="Le solde du client sera restitue"
          >
            Cette action est irreversible.
          </Alert>
          {renduASupprimer && (
            <div className="bg-bgElevated rounded-md p-3 text-sm space-y-1">
              <p>
                <span className="text-textSecondary">Remboursement:</span>{" "}
                <span className="font-mono">#{renduASupprimer.numRendu}</span>
              </p>
              <p>
                <span className="text-textSecondary">Pret:</span>{" "}
                <span className="font-mono">#{renduASupprimer.numPret}</span>
              </p>
              <p>
                <span className="text-textSecondary">Montant:</span>{" "}
                <span className="font-bold text-accent">
                  {formatMontant(renduASupprimer.restPaye)}
                </span>
              </p>
              <p>
                <span className="text-textSecondary">Date:</span>{" "}
                {formatDate(renduASupprimer.dateRendu)}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button
            variante="fantome"
            onClick={() => {
              setModalSupprimer(false);
              setRenduASupprimer(null);
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
