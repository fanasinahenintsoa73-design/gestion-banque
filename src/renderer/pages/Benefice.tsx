import { useEffect, useState } from "react";
import {
  TrendingUp,
  HandCoins,
  CircleDollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMontant, formatDate } from "@/lib/utils";
import { calculerCommission } from "@/lib/validations";
import type { PretDetails, BeneficeBanque } from "@shared/types";

export default function Benefice() {
  const [prets, setPrets] = useState<PretDetails[]>([]);
  const [benefice, setBenefice] = useState<BeneficeBanque | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([
      window.api.prets.listerDetails(),
      window.api.prets.beneficeCumule(),
    ])
      .then(([p, b]) => {
        setPrets(p);
        setBenefice(b);
      })
      .finally(() => setChargement(false));
  }, []);

  const stats = {
    toutPaye: prets.filter((p) => p.situation === "Tout paye"),
    payeUnePart: prets.filter((p) => p.situation === "Paye une part"),
    aucunRemboursement: prets.filter((p) => p.situation === "Aucun remboursement"),
  };

  const commissionTotale = prets.reduce((s, p) => s + p.commissionBanque, 0);
  const montantPrete = prets.reduce((s, p) => s + p.montantPret, 0);
  const totalRembourse = prets.reduce((s, p) => s + p.totalRembourse, 0);
  const resteARembourser = prets.reduce((s, p) => s + p.resteARembourser, 0);
  const masseTotale = montantPrete + commissionTotale;

  if (chargement) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Benefice banque</h1>
        <p className="text-textSecondary text-center py-12">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Benefice banque</h1>
        <p className="text-sm text-textSecondary mt-1">
          Commissions de 10% sur les prets octroyes
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          titre="Benefice cumule"
          valeur={
            benefice ? formatMontant(benefice.totalCommissions) : "..."
          }
          icone={TrendingUp}
          sousTexte="depuis le debut"
          variation="+ commissions"
          varianteVariation="positive"
        />
        <StatCard
          titre="Nombre de prets"
          valeur={benefice?.nombrePrets ?? 0}
          icone={HandCoins}
        />
        <StatCard
          titre="Montant total prete"
          valeur={benefice ? formatMontant(benefice.montantTotalPrete) : "..."}
          icone={CircleDollarSign}
        />
        <StatCard
          titre="Reste a rembourser"
          valeur={formatMontant(resteARembourser)}
          icone={Banknote}
          sousTexte={`${formatMontant(totalRembourse)} deja rembourse`}
        />
      </div>

      <Card>
        <CardHeader
          titre="Repartition des fonds"
          sousTitre="Visualisation de la masse financiere en jeu"
        />
        {prets.length === 0 ? (
          <EmptyState
            titre="Aucune donnee"
            description="Octroyez des prets pour voir la repartition."
          />
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-textSecondary uppercase tracking-wider font-bold">
                  Distribution financiere
                </span>
                <span className="text-textSecondary">
                  Total: {formatMontant(masseTotale)}
                </span>
              </div>
              <div className="w-full h-8 rounded-full overflow-hidden flex">
                <div
                  className="bg-accent h-full flex items-center justify-center"
                  style={{
                    width: `${(montantPrete / masseTotale) * 100}%`,
                  }}
                >
                  <span className="text-xs font-bold text-black">
                    Capital {Math.round((montantPrete / masseTotale) * 100)}%
                  </span>
                </div>
                <div
                  className="bg-warning h-full flex items-center justify-center"
                  style={{
                    width: `${(commissionTotale / masseTotale) * 100}%`,
                  }}
                >
                  <span className="text-xs font-bold text-black">
                    Benef{" "}
                    {Math.round((commissionTotale / masseTotale) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-bgElevated rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-xs uppercase tracking-wider font-bold text-textSecondary">
                    Capital prete
                  </span>
                </div>
                <p className="text-2xl font-bold text-accent">
                  {formatMontant(montantPrete)}
                </p>
                <p className="text-xs text-textSecondary mt-1">
                  Somme des montants empruntes par les clients
                </p>
              </div>
              <div className="p-4 bg-bgElevated rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-xs uppercase tracking-wider font-bold text-textSecondary">
                    Commission banque (10%)
                  </span>
                </div>
                <p className="text-2xl font-bold text-warning">
                  {formatMontant(commissionTotale)}
                </p>
                <p className="text-xs text-textSecondary mt-1">
                  Benefice net pour la banque
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-textSecondary uppercase tracking-wider font-bold">
                  Taux de remboursement global
                </span>
                <span className="text-accent font-bold">
                  {montantPrete > 0
                    ? Math.round((totalRembourse / montantPrete) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden bg-bgElevated">
                <div
                  className="h-full bg-accent transition-all"
                  style={{
                    width: `${
                      montantPrete > 0
                        ? (totalRembourse / montantPrete) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-textSecondary">
                  Rembourse: {formatMontant(totalRembourse)}
                </span>
                <span className="text-error font-semibold">
                  Reste: {formatMontant(resteARembourser)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader titre="Prets par situation" />
        {prets.length === 0 ? (
          <EmptyState titre="Aucun pret" />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-bgElevated rounded-md text-left">
              <div className="flex items-center justify-between mb-2">
                <Badge variante="succes">
                  <CheckCircle2 size={12} className="inline mr-1" />
                  Tout paye
                </Badge>
                <span className="text-3xl font-bold text-accent">
                  {stats.toutPaye.length}
                </span>
              </div>
              <p className="text-xs text-textSecondary">
                {formatMontant(
                  stats.toutPaye.reduce((s, p) => s + p.montantPret, 0)
                )}{" "}
                rembourses
              </p>
            </div>

            <div className="p-4 bg-bgElevated rounded-md text-left">
              <div className="flex items-center justify-between mb-2">
                <Badge variante="avertissement">
                  <Clock size={12} className="inline mr-1" />
                  Paye une part
                </Badge>
                <span className="text-3xl font-bold text-warning">
                  {stats.payeUnePart.length}
                </span>
              </div>
              <p className="text-xs text-textSecondary">
                {formatMontant(
                  stats.payeUnePart.reduce((s, p) => s + p.resteARembourser, 0)
                )}{" "}
                restant
              </p>
            </div>

            <div className="p-4 bg-bgElevated rounded-md text-left">
              <div className="flex items-center justify-between mb-2">
                <Badge variante="erreur">
                  <AlertCircle size={12} className="inline mr-1" />
                  Aucun remboursement
                </Badge>
                <span className="text-3xl font-bold text-error">
                  {stats.aucunRemboursement.length}
                </span>
              </div>
              <p className="text-xs text-textSecondary">
                {formatMontant(
                  stats.aucunRemboursement.reduce(
                    (s, p) => s + p.montantPret,
                    0
                  )
                )}{" "}
                en attente
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          titre="Detail des prets et benefice"
          action={<Badge>{prets.length}</Badge>}
        />
        {prets.length === 0 ? (
          <EmptyState titre="Aucun pret a afficher" />
        ) : (
          <Table
            donnees={prets}
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
                    <p className="text-xs text-textSecondary">
                      {formatDate(p.datePret)}
                    </p>
                  </div>
                ),
              },
              {
                cle: "montantPret",
                libelle: "Montant",
                alignement: "droite",
                rendu: (p) => (
                  <span className="font-semibold">
                    {formatMontant(p.montantPret)}
                  </span>
                ),
              },
              {
                cle: "commissionBanque",
                libelle: "Benefice banque",
                alignement: "droite",
                rendu: (p) => (
                  <span className="font-bold text-warning">
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
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
