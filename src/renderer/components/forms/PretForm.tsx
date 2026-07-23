import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  calculerCommission,
  calculerNet,
} from "@/lib/validations";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { HandCoins } from "lucide-react";
import { formatMontant } from "@/lib/utils";
import type { Client } from "@shared/types";

const schemaPretSimple = z.object({
  numCompte: z.string().min(1, "Veuillez selectionner un client"),
  montantPret: z
    .number({ invalid_type_error: "Montant invalide" })
    .int("Le montant doit etre un entier")
    .positive("Le montant doit etre strictement positif"),
  datePret: z.string().min(1, "Date obligatoire"),
});

type PretFormValues = z.infer<typeof schemaPretSimple>;

interface PretFormProps {
  clients: Client[];
  onSoumettre: (
    numCompte: string,
    montant: number,
    date: string
  ) => Promise<{ succes: boolean; erreur?: string }>;
  onAnnuler: () => void;
}

export function PretForm({
  clients,
  onSoumettre,
  onAnnuler,
}: PretFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PretFormValues>({
    resolver: zodResolver(schemaPretSimple),
    defaultValues: {
      numCompte: "",
      montantPret: 0,
      datePret: new Date().toISOString().split("T")[0],
    },
  });

  const montant = watch("montantPret");
  const montantSaisi = typeof montant === "number" && montant > 0;

  const onSubmit = async (data: PretFormValues) => {
    const result = await onSoumettre(
      data.numCompte,
      data.montantPret,
      data.datePret
    );

    if (!result.succes && result.erreur) {
      setError("root", { type: "manual", message: result.erreur });
    }
  };

  const optionsClients = [
    { valeur: "", libelle: "Selectionner un client..." },
    ...clients.map((c) => ({
      valeur: c.numCompte,
      libelle: `${c.numCompte} - ${c.nom} ${c.prenoms} (solde: ${formatMontant(c.solde)})`,
    })),
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <Alert variante="erreur">{errors.root.message}</Alert>
      )}

      <Select
        label="Client beneficiaire"
        options={optionsClients}
        erreur={errors.numCompte?.message}
        {...register("numCompte")}
      />

      <Input
        label="Montant du pret (Ar)"
        type="number"
        placeholder="5000000"
        erreur={errors.montantPret?.message}
        {...register("montantPret", { valueAsNumber: true })}
      />

      <Input
        label="Date du pret"
        type="date"
        erreur={errors.datePret?.message}
        {...register("datePret")}
      />

      {montantSaisi && (
        <div className="bg-bgElevated rounded-md p-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-textSecondary font-bold mb-2">
            Decomposition du pret
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">Montant emprunte</span>
            <span className="font-semibold text-textPrimary">
              {formatMontant(montant)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">Commission banque (10%)</span>
            <span className="font-semibold text-warning">
              - {formatMontant(calculerCommission(montant))}
            </span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary font-bold">
              Net credite au client
            </span>
            <span className="font-bold text-accent text-base">
              {formatMontant(calculerNet(montant))}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variante="fantome" onClick={onAnnuler}>
          Annuler
        </Button>
        <Button
          type="submit"
          variante="primaire"
          charge={isSubmitting}
          iconeGauche={<HandCoins size={14} />}
        >
          Octroyer le pret
        </Button>
      </div>
    </form>
  );
}
