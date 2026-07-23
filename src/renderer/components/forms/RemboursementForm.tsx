import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatMontant } from "@/lib/utils";
import type { PretDetails } from "@shared/types";

const schemaRemboursementSimple = z.object({
  numPret: z.number({ invalid_type_error: "Veuillez selectionner un pret" })
    .positive("Veuillez selectionner un pret"),
  restPaye: z
    .number({ invalid_type_error: "Montant invalide" })
    .int("Le montant doit etre un entier")
    .nonnegative("Le montant doit etre positif ou nul"),
  dateRendu: z.string().min(1, "Date obligatoire"),
});

type RemboursementFormValues = z.infer<typeof schemaRemboursementSimple>;

interface RemboursementFormProps {
  prets: PretDetails[];
  onSoumettre: (
    numPret: number,
    restPaye: number,
    date: string
  ) => Promise<{ succes: boolean; erreur?: string }>;
  onAnnuler: () => void;
}

export function RemboursementForm({
  prets,
  onSoumettre,
  onAnnuler,
}: RemboursementFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RemboursementFormValues>({
    resolver: zodResolver(schemaRemboursementSimple),
    defaultValues: {
      numPret: 0,
      restPaye: 0,
      dateRendu: new Date().toISOString().split("T")[0],
    },
  });

  const numPretChoisi = watch("numPret");
  const restPaye = watch("restPaye");

  const pretSelectionne = prets.find((p) => p.numPret === numPretChoisi);

  const optionsPrets = [
    { valeur: "0", libelle: "Selectionner un pret..." },
    ...prets
      .filter((p) => p.situation !== "Tout paye")
      .map((p) => ({
        valeur: String(p.numPret),
        libelle: `Pret #${p.numPret} - ${p.nomClient} ${p.prenomClient} (reste: ${formatMontant(p.resteARembourser)})`,
      })),
  ];

  const onSubmit = async (data: RemboursementFormValues) => {
    if (pretSelectionne && data.restPaye > pretSelectionne.resteARembourser) {
      setError("restPaye", {
        type: "manual",
        message: `Maximum autorise: ${formatMontant(pretSelectionne.resteARembourser)}`,
      });
      return;
    }

    const result = await onSoumettre(
      data.numPret,
      Number(data.restPaye),
      data.dateRendu
    );

    if (!result.succes && result.erreur) {
      setError("root", { type: "manual", message: result.erreur });
    }
  };

  const restPayeNumber = typeof restPaye === "number" ? restPaye : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && <Alert variante="erreur">{errors.root.message}</Alert>}

      <Select
        label="Pret concerne"
        options={optionsPrets}
        erreur={errors.numPret?.message}
        {...register("numPret", { valueAsNumber: true })}
      />

      {pretSelectionne && (
        <div className="bg-bgElevated rounded-md p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-textSecondary">Client</span>
            <span className="font-semibold">
              {pretSelectionne.nomClient} {pretSelectionne.prenomClient}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Montant du pret</span>
            <span className="font-semibold">
              {formatMontant(pretSelectionne.montantPret)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Deja rembourse</span>
            <span className="font-semibold text-accent">
              {formatMontant(pretSelectionne.totalRembourse)}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-1">
            <span className="text-textSecondary font-bold">Reste a payer</span>
            <span className="font-bold text-error">
              {formatMontant(pretSelectionne.resteARembourser)}
            </span>
          </div>
        </div>
      )}

      <Input
        label="Montant rembourse (Ar)"
        type="number"
        placeholder="0"
        erreur={errors.restPaye?.message}
        {...register("restPaye", { valueAsNumber: true })}
      />

      <Input
        label="Date du remboursement"
        type="date"
        erreur={errors.dateRendu?.message}
        {...register("dateRendu")}
      />

      {pretSelectionne && restPayeNumber > 0 && (
        <div className="bg-bgElevated rounded-md p-3 text-sm space-y-1">
          <p className="text-textSecondary text-xs">Apres ce remboursement:</p>
          <p className="font-bold">
            Nouvelle situation:{" "}
            {restPayeNumber >= pretSelectionne.resteARembourser ? (
              <span className="text-accent">Tout paye</span>
            ) : (
              <span className="text-warning">Paye une part</span>
            )}
          </p>
          <p className="text-textSecondary text-xs mt-1">
            Reste:{" "}
            {formatMontant(
              Math.max(0, pretSelectionne.resteARembourser - restPayeNumber)
            )}
          </p>
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
        >
          Enregistrer le remboursement
        </Button>
      </div>
    </form>
  );
}
