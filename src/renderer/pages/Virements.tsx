import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  Plus,
  FileText,
  Trash2,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { formatMontant, formatDate } from "@/lib/utils";
import type { Client, VirementDetails } from "@shared/types";

export default function Virements() {
  const [clients, setClients] = useState<Client[]>([]);
  const [virements, setVirements] = useState<VirementDetails[]>([]);
  const [chargement, setChargement] = useState(true);
  const [alerte, setAlerte] = useState<{
    type: "succes" | "erreur";
    message: string;
  } | null>(null);

  const [modalCreer, setModalCreer] = useState(false);
  const [modalSupprimer, setModalSupprimer] = useState(false);
  const [virementASupprimer, setVirementASupprimer] = useState<VirementDetails | null>(null);

  const [pdfEnCours, setPdfEnCours] = useState<number | null>(null);

  const [form, setForm] = useState({
    emetteur: "",
    beneficiaire: "",
    montant: "",
    date: new Date().toISOString().split("T")[0],
  });

  const charger = async () => {
    setChargement(true);
    try {
      const [c, v] = await Promise.all([
        window.api.clients.lister(),
        window.api.virements.listerDetails(),
      ]);
      setClients(c);
      setVirements(v);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const ouvrirNouveau = () => {
    setForm({
      emetteur: "",
      beneficiaire: "",
      montant: "",
      date: new Date().toISOString().split("T")[0],
    });
    setModalCreer(true);
  };

  const executer = async () => {
    if (!form.emetteur || !form.beneficiaire || !form.montant || !form.date) {
      setAlerte({ type: "erreur", message: "Tous les champs sont obligatoires" });
      return;
    }
    const montant = parseInt(form.montant, 10);
    if (isNaN(montant) || montant <= 0) {
      setAlerte({ type: "erreur", message: "Le montant doit etre un entier positif" });
      return;
    }
    if (form.emetteur === form.beneficiaire) {
      setAlerte({
        type: "erreur",
        message: "L'emetteur et le beneficiaire doivent etre differents",
      });
      return;
    }

    const r = await window.api.virements.executer(
      form.emetteur,
      form.beneficiaire,
      montant,
      form.date
    );

    if (r.succes) {
      setAlerte({
        type: "succes",
        message: `Virement de ${formatMontant(montant)} execute avec succes`,
      });
      setModalCreer(false);
      charger();
    } else {
      setAlerte({ type: "erreur", message: r.erreur });
    }
  };

  const ouvrirSupprimer = (v: VirementDetails) => {
    setVirementASupprimer(v);
    setModalSupprimer(true);
  };

  const supprimer = async () => {
    if (!virementASupprimer) return;
    const r = await window.api.virements.supprimer(virementASupprimer.id);
    if (r.succes) {
      setAlerte({
        type: "succes",
        message: "Virement annule, soldes restaures",
      });
      setModalSupprimer(false);
      setVirementASupprimer(null);
      charger();
    } else {
      setAlerte({ type: "erreur", message: r.erreur });
    }
  };

  const genererPdf = async (id: number) => {
    setPdfEnCours(id);
    try {
      const r = await window.api.pdf.genererAvisVirement(id, "Banque Nationale");
      if (r.succes) {
        setAlerte({
          type: "succes",
          message: `PDF genere : ${r.data.chemin}`,
        });
        await window.api.pdf.ouvrir(r.data.chemin);
      } else {
        setAlerte({ type: "erreur", message: r.erreur });
      }
    } catch (e) {
      setAlerte({ type: "erreur", message: String(e) });
    } finally {
      setPdfEnCours(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Virements</h1>
          <p className="text-sm text-textSecondary mt-1">
            Execution et historique des virements
          </p>
        </div>
        <Button
          variante="primaire"
          iconeGauche={<Plus size={14} />}
          onClick={ouvrirNouveau}
        >
          Nouveau virement
        </Button>
      </div>

      {alerte && (
        <Alert
          variante={alerte.type}
          fermable
          onFermer={() => setAlerte(null)}
        >
          {alerte.message}
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bgElevated flex items-center justify-center">
              <ArrowRightLeft size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-textSecondary uppercase tracking-wider font-bold">
                Total virements
              </p>
              <p className="text-2xl font-bold">{virements.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bgElevated flex items-center justify-center">
              <Wallet size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-textSecondary uppercase tracking-wider font-bold">
                Montant total transfere
              </p>
              <p className="text-2xl font-bold text-accent">
                {formatMontant(virements.reduce((s, v) => s + v.montant, 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bgElevated flex items-center justify-center">
              <FileText size={18} className="text-textSecondary" />
            </div>
            <div>
              <p className="text-xs text-textSecondary uppercase tracking-wider font-bold">
                Dossier PDF
              </p>
              <p className="text-lg font-bold text-textSecondary text-sm">
                Documents/Banque-Avis
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          titre="Historique des virements"
          action={<Badge>{virements.length}</Badge>}
        />
        {chargement ? (
          <p className="text-sm text-textSecondary text-center py-8">
            Chargement...
          </p>
        ) : virements.length === 0 ? (
          <EmptyState
            titre="Aucun virement"
            description="Executez votre premier virement."
            action={
              <Button
                taille="sm"
                variante="primaire"
                iconeGauche={<Plus size={14} />}
                onClick={ouvrirNouveau}
              >
                Executer un virement
              </Button>
            }
          />
        ) : (
          <Table
            donnees={virements}
            clePrimaire="id"
            colonnes={[
              {
                cle: "id",
                libelle: "N°",
                largeur: "70px",
                rendu: (v) => (
                  <Badge variante="info">#{String(v.id).padStart(3, "0")}</Badge>
                ),
              },
              {
                cle: "emetteur",
                libelle: "Emetteur",
                rendu: (v) => (
                  <div>
                    <p className="font-semibold text-sm">
                      {v.nomEmetteur} {v.prenomEmetteur}
                    </p>
                    <p className="text-xs text-textSecondary font-mono">
                      {v.numCompteEmetteur}
                    </p>
                  </div>
                ),
              },
              {
                cle: "fleche",
                libelle: "",
                largeur: "40px",
                alignement: "centre",
                rendu: () => (
                  <ArrowRightLeft size={16} className="text-accent mx-auto" />
                ),
              },
              {
                cle: "beneficiaire",
                libelle: "Beneficiaire",
                rendu: (v) => (
                  <div>
                    <p className="font-semibold text-sm">
                      {v.nomBeneficiaire} {v.prenomBeneficiaire}
                    </p>
                    <p className="text-xs text-textSecondary font-mono">
                      {v.numCompteBeneficiaire}
                    </p>
                  </div>
                ),
              },
              {
                cle: "montant",
                libelle: "Montant",
                alignement: "droite",
                rendu: (v) => (
                  <span className="font-bold text-accent">
                    {formatMontant(v.montant)}
                  </span>
                ),
              },
              {
                cle: "dateTransfert",
                libelle: "Date",
                rendu: (v) => (
                  <span className="text-sm text-textSecondary">
                    {formatDate(v.dateTransfert)}
                  </span>
                ),
              },
              {
                cle: "actions",
                libelle: "",
                alignement: "droite",
                rendu: (v) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      taille="sm"
                      variante="contour"
                      iconeGauche={<FileText size={12} />}
                      charge={pdfEnCours === v.id}
                      onClick={() => genererPdf(v.id)}
                    >
                      PDF
                    </Button>
                    <button
                      onClick={() => ouvrirSupprimer(v)}
                      className="w-8 h-8 rounded-full hover:bg-bgElevated flex items-center justify-center text-textSecondary hover:text-error transition-colors"
                      title="Annuler le virement"
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
        titre="Executer un virement"
        description="Le solde des comptes sera mis a jour immediatement"
        taille="md"
      >
        <div className="space-y-4">
          <Select
            label="Compte emetteur"
            value={form.emetteur}
            onChange={(e) => setForm({ ...form, emetteur: e.target.value })}
            options={[
              { valeur: "", libelle: "Selectionner un compte..." },
              ...clients.map((c) => ({
                valeur: c.numCompte,
                libelle: `${c.numCompte} - ${c.nom} ${c.prenoms} (${formatMontant(c.solde)})`,
              })),
            ]}
          />

          <Select
            label="Compte beneficiaire"
            value={form.beneficiaire}
            onChange={(e) => setForm({ ...form, beneficiaire: e.target.value })}
            options={[
              { valeur: "", libelle: "Selectionner un compte..." },
              ...clients
                .filter((c) => c.numCompte !== form.emetteur)
                .map((c) => ({
                  valeur: c.numCompte,
                  libelle: `${c.numCompte} - ${c.nom} ${c.prenoms} (${formatMontant(c.solde)})`,
                })),
            ]}
          />

          <Input
            label="Montant (Ar)"
            type="number"
            placeholder="2000000"
            value={form.montant}
            onChange={(e) => setForm({ ...form, montant: e.target.value })}
          />

          <Input
            label="Date du transfert"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          {form.emetteur && form.beneficiaire && form.montant && (
            <Alert variante="info">
              Virement de{" "}
              <span className="font-bold text-accent">
                {formatMontant(parseInt(form.montant) || 0)}
              </span>{" "}
              du compte{" "}
              <span className="font-mono font-bold">{form.emetteur}</span> vers{" "}
              <span className="font-mono font-bold">{form.beneficiaire}</span>
            </Alert>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button variante="fantome" onClick={() => setModalCreer(false)}>
            Annuler
          </Button>
          <Button
            variante="primaire"
            iconeGauche={<ArrowRightLeft size={14} />}
            onClick={executer}
          >
            Executer
          </Button>
        </div>
      </Modal>

      <Modal
        ouvert={modalSupprimer}
        onFermer={() => { setModalSupprimer(false); setVirementASupprimer(null); }}
        titre="Annuler le virement"
        taille="sm"
      >
        <div className="space-y-3">
          <Alert variante="avertissement" titre="Les soldes seront restaures">
            Cette action est irreversible. Les montants seront credits/debités
            sur les comptes d'origine.
          </Alert>
          {virementASupprimer && (
            <div className="bg-bgElevated rounded-md p-3 text-sm space-y-1">
              <p>
                <span className="text-textSecondary">De :</span>{" "}
                {virementASupprimer.nomEmetteur}{" "}
                {virementASupprimer.prenomEmetteur}
              </p>
              <p>
                <span className="text-textSecondary">Vers :</span>{" "}
                {virementASupprimer.nomBeneficiaire}{" "}
                {virementASupprimer.prenomBeneficiaire}
              </p>
              <p>
                <span className="text-textSecondary">Montant :</span>{" "}
                <span className="font-bold text-accent">
                  {formatMontant(virementASupprimer.montant)}
                </span>
              </p>
              <p>
                <span className="text-textSecondary">Date :</span>{" "}
                {formatDate(virementASupprimer.dateTransfert)}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button
            variante="fantome"
            onClick={() => { setModalSupprimer(false); setVirementASupprimer(null); }}
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
