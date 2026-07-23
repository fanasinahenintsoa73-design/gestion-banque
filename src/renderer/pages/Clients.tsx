import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Users, Wallet, X } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { ClientForm } from "@/components/forms/ClientForm";
import { formatMontant } from "@/lib/utils";
import type { Client } from "@shared/types";

type ModeModal = null | "creer" | "modifier" | "supprimer";

export default function Clients() {
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modeModal, setModeModal] = useState<ModeModal>(null);
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null);
  const [alerte, setAlerte] = useState<{
    type: "succes" | "erreur" | "avertissement";
    message: string;
  } | null>(null);

  const charger = useCallback(async (terme?: string) => {
    if (terme !== undefined) {
      setRechercheEnCours(true);
    } else {
      setChargement(true);
    }
    try {
      const data = terme
        ? await window.api.clients.rechercher(terme)
        : await window.api.clients.lister();
      setClients(data);
    } catch (e) {
      setAlerte({ type: "erreur", message: String(e) });
    } finally {
      setChargement(false);
      setRechercheEnCours(false);
    }
  }, []);

  useEffect(() => {
    const termeUrl = searchParams.get("q");
    if (termeUrl) {
      setRecherche(termeUrl);
      charger(termeUrl);
    } else {
      charger();
    }
  }, [charger, searchParams]);

  const handleRechercheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const terme = e.target.value;
    setRecherche(terme);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      charger(terme.trim() || undefined);
    }, 300);
  };

  const effacerRecherche = () => {
    setRecherche("");
    charger();
  };

  const resultatsRecherche = useMemo(() => clients, [clients]);

  const ouvrirCreation = () => {
    setClientSelectionne(null);
    setModeModal("creer");
  };

  const ouvrirModification = (client: Client) => {
    setClientSelectionne(client);
    setModeModal("modifier");
  };

  const ouvrirSuppression = (client: Client) => {
    setClientSelectionne(client);
    setModeModal("supprimer");
  };

  const fermerModal = () => {
    setModeModal(null);
    setClientSelectionne(null);
  };

  const creer = async (client: Client) => {
    const r = await window.api.clients.creer(client);
    if (r.succes) {
      setAlerte({ type: "succes", message: "Client cree avec succes" });
      fermerModal();
      charger();
    }
    return r;
  };

  const modifier = async (client: Client) => {
    if (!clientSelectionne) return { succes: false, erreur: "Pas de client" };
    const r = await window.api.clients.modifier(clientSelectionne.numCompte, client);
    if (r.succes) {
      setAlerte({ type: "succes", message: "Client modifie avec succes" });
      fermerModal();
      charger();
    }
    return r;
  };

  const supprimer = async () => {
    if (!clientSelectionne) return;
    const r = await window.api.clients.supprimer(clientSelectionne.numCompte);
    if (r.succes) {
      setAlerte({ type: "succes", message: "Client supprime" });
      fermerModal();
      charger();
    } else {
      setAlerte({ type: "erreur", message: r.erreur || "Erreur suppression" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-textSecondary mt-1">
            Gestion complete des comptes clients - CRUD + recherche
          </p>
        </div>
        <Button
          variante="primaire"
          iconeGauche={<Plus size={14} />}
          onClick={ouvrirCreation}
        >
          Nouveau client
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
              <Users size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-textSecondary uppercase tracking-wider font-bold">
                Total clients
              </p>
              <p className="text-2xl font-bold text-textPrimary">
                {clients.length}
              </p>
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
                Total soldes
              </p>
              <p className="text-2xl font-bold text-accent">
                {formatMontant(clients.reduce((s, c) => s + c.solde, 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bgElevated flex items-center justify-center">
              <Search size={18} className="text-textSecondary" />
            </div>
            <div>
              <p className="text-xs text-textSecondary uppercase tracking-wider font-bold">
                Resultats affiches
              </p>
              <p className="text-2xl font-bold text-textPrimary">
                {resultatsRecherche.length}
                <span className="text-sm text-textSecondary font-normal ml-2">
                  / {clients.length}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par numero de compte, nom, prenom ou email..."
              iconeGauche={rechercheEnCours ? <span className="inline-block w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : <Search size={16} />}
              value={recherche}
              onChange={handleRechercheChange}
            />
          </div>
          {recherche && (
            <Button
              taille="sm"
              variante="contour"
              iconeGauche={<X size={14} />}
              onClick={effacerRecherche}
            >
              Effacer
            </Button>
          )}
        </div>
        {recherche && (
          <p className="text-xs text-textSecondary mt-2">
            Recherche LIKE SQL sur :{" "}
            <span className="font-mono text-textPrimary">%{recherche}%</span>
          </p>
        )}
      </Card>

      <Card>
        <CardHeader
          titre="Liste des clients"
          action={<Badge>{resultatsRecherche.length}</Badge>}
        />
        {chargement ? (
          <p className="text-sm text-textSecondary text-center py-8">
            Chargement...
          </p>
        ) : resultatsRecherche.length === 0 ? (
          <EmptyState
            titre={recherche ? "Aucun resultat" : "Aucun client"}
            description={
              recherche
                ? `Aucun client ne correspond a "${recherche}"`
                : "Commencez par creer votre premier client."
            }
            action={
              !recherche && (
                <Button
                  taille="sm"
                  variante="primaire"
                  iconeGauche={<Plus size={14} />}
                  onClick={ouvrirCreation}
                >
                  Creer un client
                </Button>
              )
            }
          />
        ) : (
          <Table
            donnees={resultatsRecherche}
            clePrimaire="numCompte"
            colonnes={[
              {
                cle: "numCompte",
                libelle: "Compte",
                largeur: "120px",
                rendu: (c) => (
                  <span className="font-mono text-xs">{c.numCompte}</span>
                ),
              },
              {
                cle: "nom",
                libelle: "Nom & Prenoms",
                rendu: (c) => (
                  <div>
                    <p className="font-semibold">{c.nom}</p>
                    <p className="text-xs text-textSecondary">{c.prenoms}</p>
                  </div>
                ),
              },
              {
                cle: "tel",
                libelle: "Telephone",
                rendu: (c) => (
                  <span className="text-sm text-textSecondary">{c.tel}</span>
                ),
              },
              {
                cle: "mail",
                libelle: "Email",
                rendu: (c) => (
                  <span className="text-sm text-textSecondary">{c.mail}</span>
                ),
              },
              {
                cle: "solde",
                libelle: "Solde",
                alignement: "droite",
                rendu: (c) => (
                  <span className="font-bold text-accent">
                    {formatMontant(c.solde)}
                  </span>
                ),
              },
              {
                cle: "actions",
                libelle: "",
                alignement: "droite",
                rendu: (c) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => ouvrirModification(c)}
                      className="w-8 h-8 rounded-full hover:bg-bgElevated flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => ouvrirSuppression(c)}
                      className="w-8 h-8 rounded-full hover:bg-bgElevated flex items-center justify-center text-textSecondary hover:text-error transition-colors"
                      title="Supprimer"
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
        ouvert={modeModal === "creer"}
        onFermer={fermerModal}
        titre="Creer un client"
        description="Tous les champs sont obligatoires"
        taille="md"
      >
        <ClientForm
          clientsExistants={clients}
          onSoumettre={creer}
          onAnnuler={fermerModal}
        />
      </Modal>

      <Modal
        ouvert={modeModal === "modifier"}
        onFermer={fermerModal}
        titre="Modifier le client"
        description={clientSelectionne?.numCompte || ""}
        taille="md"
      >
        <ClientForm
          clientExistant={clientSelectionne}
          clientsExistants={clients}
          onSoumettre={modifier}
          onAnnuler={fermerModal}
        />
      </Modal>

      <Modal
        ouvert={modeModal === "supprimer"}
        onFermer={fermerModal}
        titre="Supprimer le client"
        taille="sm"
        actions={
          <>
            <Button variante="fantome" onClick={fermerModal}>
              Annuler
            </Button>
            <Button variante="danger" onClick={supprimer} iconeGauche={<Trash2 size={14} />}>
              Supprimer definitivement
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Alert variante="avertissement" titre="Cette action est irreversible">
            Le client et toutes ses donnees seront definitivement supprimes.
          </Alert>
          {clientSelectionne && (
            <div className="bg-bgElevated rounded-md p-3 text-sm">
              <p>
                <span className="text-textSecondary">Compte :</span>{" "}
                <span className="font-mono">{clientSelectionne.numCompte}</span>
              </p>
              <p>
                <span className="text-textSecondary">Nom :</span>{" "}
                <span className="font-semibold">
                  {clientSelectionne.nom} {clientSelectionne.prenoms}
                </span>
              </p>
              <p>
                <span className="text-textSecondary">Solde :</span>{" "}
                <span className="font-bold text-accent">
                  {formatMontant(clientSelectionne.solde)}
                </span>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
