import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ArrowRightLeft,
  HandCoins,
  TrendingUp,
  CircleDollarSign,
  Receipt,
  ArrowUpRight,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { formatMontant, formatDate } from "@/lib/utils";
import type {
  Client,
  VirementDetails,
  PretDetails,
  BeneficeBanque,
} from "@shared/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [virements, setVirements] = useState<VirementDetails[]>([]);
  const [prets, setPrets] = useState<PretDetails[]>([]);
  const [benefice, setBenefice] = useState<BeneficeBanque | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([
      window.api.clients.lister(),
      window.api.virements.listerDetails(),
      window.api.prets.listerDetails(),
      window.api.prets.beneficeCumule(),
    ])
      .then(([c, v, p, b]) => {
        setClients(c);
        setVirements(v);
        setPrets(p);
        setBenefice(b);
      })
      .finally(() => setChargement(false));
  }, []);

  const totalSoldes = clients.reduce((s, c) => s + c.solde, 0);
  const pretsEnCours = prets.filter((p) => p.situation !== "Tout paye");
  const montantEnCours = pretsEnCours.reduce((s, p) => s + p.resteARembourser, 0);

  const aujourdHui = new Date().toISOString().split("T")[0];
  const virementsAujourdHui = virements.filter((v) => v.dateTransfert === aujourdHui);
  const montantVirementsAujourdHui = virementsAujourdHui.reduce((s, v) => s + v.montant, 0);

  const pretsARelancer = prets.filter(
    (p) => p.situation === "Paye une part" && p.resteARembourser > 0
  );

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-textSecondary mt-1">
            Vue d'ensemble de l'activite bancaire
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            taille="sm"
            variante="contour"
            iconeGauche={<ArrowRightLeft size={14} />}
            onClick={() => navigate("/virements")}
          >
            Virement
          </Button>
          <Button
            taille="sm"
            variante="primaire"
            iconeGauche={<HandCoins size={14} />}
            onClick={() => navigate("/prets")}
          >
            Pret
          </Button>
        </div>
      </div>

      {pretsARelancer.length > 0 && (
        <Alert
          variante="avertissement"
          titre={`${pretsARelancer.length} pret(s) a relancer`}
        >
          Des remboursements partiels sont en attente. Consultez la page{" "}
           <button onClick={() => navigate("/rendus")} className="underline font-semibold">
            Remboursements
          </button>
          .
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          titre="Clients"
          valeur={chargement ? "..." : clients.length}
          icone={Users}
          sousTexte="comptes actifs"
        />
        <StatCard
          titre="Virements"
          valeur={chargement ? "..." : virements.length}
          icone={ArrowRightLeft}
          sousTexte="au total"
        />
        <StatCard
          titre="Prets en cours"
          valeur={chargement ? "..." : pretsEnCours.length}
          icone={HandCoins}
          sousTexte={`${formatMontant(montantEnCours)} restant`}
        />
        <StatCard
          titre="Benefice banque"
          valeur={benefice ? formatMontant(benefice.totalCommissions) : "..."}
          icone={TrendingUp}
          variation="commissions 10%"
          varianteVariation="positive"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader
            titre="Derniers virements"
            sousTitre="Les plus recents"
            action={
              <Button
                taille="sm"
                variante="fantome"
                onClick={() => navigate("/virements")}
                iconeDroite={<ArrowUpRight size={12} />}
              >
                Tout voir
              </Button>
            }
          />
          {chargement ? (
            <p className="text-sm text-textSecondary text-center py-6">
              Chargement...
            </p>
          ) : virements.length === 0 ? (
            <p className="text-sm text-textSecondary text-center py-6">
              Aucun virement enregistre
            </p>
          ) : (
            <div className="space-y-2">
              {virements.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 bg-bgElevated rounded-md hover:bg-bgCard transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-bgCard flex items-center justify-center flex-shrink-0">
                      <ArrowRightLeft size={14} className="text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {v.nomEmetteur} {v.prenomEmetteur}
                        <span className="text-textSecondary mx-2">→</span>
                        {v.nomBeneficiaire} {v.prenomBeneficiaire}
                      </p>
                      <p className="text-xs text-textSecondary">
                        {formatDate(v.dateTransfert)} -{" "}
                        <span className="font-mono">{v.numCompteEmetteur}</span>
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-accent ml-3">
                    {formatMontant(v.montant)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            titre="Prets en cours"
            action={<HandCoins size={18} className="text-textSecondary" />}
          />
          {chargement ? (
            <p className="text-sm text-textSecondary text-center py-6">
              Chargement...
            </p>
          ) : pretsEnCours.length === 0 ? (
            <p className="text-sm text-textSecondary text-center py-6">
              Aucun pret en cours
            </p>
          ) : (
            <div className="space-y-2">
              {pretsEnCours.slice(0, 5).map((p) => (
                <div
                  key={p.numPret}
                  className="p-3 bg-bgElevated rounded-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold">N°{p.numPret}</span>
                    <Badge
                      variante={
                        p.situation === "Paye une part" ? "avertissement" : "neutre"
                      }
                    >
                      {p.situation}
                    </Badge>
                  </div>
                  <p className="text-xs text-textSecondary mb-2">
                    {p.nomClient} {p.prenomClient}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-textSecondary">Reste a payer</span>
                    <span className="font-bold text-error">
                      {formatMontant(p.resteARembourser)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader
            titre="Activite du jour"
            action={
              <Badge variante="info">
                {virementsAujourdHui.length} operation(s)
              </Badge>
            }
          />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bgElevated flex items-center justify-center">
                <ArrowRightLeft size={18} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Virements du jour</p>
                <p className="text-xs text-textSecondary">
                  {virementsAujourdHui.length} effectue(s) aujourd'hui
                </p>
              </div>
              <p className="font-bold text-textPrimary">
                {formatMontant(montantVirementsAujourdHui)}
              </p>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bgElevated flex items-center justify-center">
                <HandCoins size={18} className="text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Prets octroyes (total)</p>
                <p className="text-xs text-textSecondary">
                  {prets.length} pret(s) au total
                </p>
              </div>
              <p className="font-bold text-textPrimary">
                {benefice ? formatMontant(benefice.montantTotalPrete) : "..."}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            titre="Apercu financier"
            action={<CircleDollarSign size={18} className="text-textSecondary" />}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-bgElevated rounded-md">
              <div className="flex items-center gap-3">
                <Wallet size={16} className="text-accent" />
                <span className="text-sm">Total soldes clients</span>
              </div>
              <span className="font-bold text-accent">
                {formatMontant(totalSoldes)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bgElevated rounded-md">
              <div className="flex items-center gap-3">
                <PiggyBank size={16} className="text-textSecondary" />
                <span className="text-sm">Montant total prete</span>
              </div>
              <span className="font-bold text-textPrimary">
                {benefice ? formatMontant(benefice.montantTotalPrete) : "..."}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bgElevated rounded-md">
              <div className="flex items-center gap-3">
                <TrendingUp size={16} className="text-warning" />
                <span className="text-sm">Commission banque cumulee</span>
              </div>
              <span className="font-bold text-warning">
                {benefice ? formatMontant(benefice.totalCommissions) : "..."}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bgElevated rounded-md">
              <div className="flex items-center gap-3">
                <Receipt size={16} className="text-error" />
                <span className="text-sm">Reste a rembourser</span>
              </div>
              <span className="font-bold text-error">
                {formatMontant(montantEnCours)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {clients.length > 0 && (
        <Card>
          <CardHeader
            titre="Top clients par solde"
            sousTitre="Les 5 plus gros comptes"
          />
          <div className="space-y-2">
            {[...clients]
              .sort((a, b) => b.solde - a.solde)
              .slice(0, 5)
              .map((c, i) => (
                <div
                  key={c.numCompte}
                  className="flex items-center gap-4 p-3 bg-bgElevated rounded-md"
                >
                  <div className="w-8 h-8 rounded-full bg-bgCard flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {c.nom} {c.prenoms}
                    </p>
                    <p className="text-xs text-textSecondary font-mono">
                      {c.numCompte}
                    </p>
                  </div>
                  <p className="font-bold text-accent">
                    {formatMontant(c.solde)}
                  </p>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
