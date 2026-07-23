import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaClient, type ClientFormValues } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { Client } from "@shared/types";

interface ClientFormProps {
  clientExistant?: Client | null;
  clientsExistants: Client[];
  onSoumettre: (client: Client) => Promise<{ succes: boolean; erreur?: string }>;
  onAnnuler: () => void;
}

export function ClientForm({
  clientExistant,
  clientsExistants,
  onSoumettre,
  onAnnuler,
}: ClientFormProps) {
  const estEdition = !!clientExistant;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(schemaClient),
    defaultValues: clientExistant
      ? {
          numCompte: clientExistant.numCompte,
          nom: clientExistant.nom,
          prenoms: clientExistant.prenoms,
          tel: clientExistant.tel,
          mail: clientExistant.mail,
        }
      : { numCompte: "", nom: "", prenoms: "", tel: "+261 ", mail: "" },
  });

  useEffect(() => {
    if (clientExistant) {
      reset({
        numCompte: clientExistant.numCompte,
        nom: clientExistant.nom,
        prenoms: clientExistant.prenoms,
        tel: clientExistant.tel,
        mail: clientExistant.mail,
      });
    }
  }, [clientExistant, reset]);

  const onSubmit = async (data: ClientFormValues) => {
    if (!estEdition) {
      const existe = clientsExistants.find(
        (c) => c.numCompte === data.numCompte
      );
      if (existe) {
        setError("numCompte", {
          type: "manual",
          message: "Ce numero de compte existe deja",
        });
        return;
      }
    }

    const client: Client = {
      ...data,
      solde: clientExistant?.solde ?? 0,
    };

    const result = await onSoumettre(client);
    if (!result.succes && result.erreur) {
      setError("root", { type: "manual", message: result.erreur });
    } else {
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <Alert variante="erreur" titre="Erreur">
          {errors.root.message}
        </Alert>
      )}

      <Input
        label="Numero de compte"
        placeholder="200999"
        erreur={errors.numCompte?.message}
        disabled={estEdition}
        {...register("numCompte")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nom"
          placeholder="RAKOTO"
          erreur={errors.nom?.message}
          {...register("nom")}
        />
        <Input
          label="Prenoms"
          placeholder="Bernard"
          erreur={errors.prenoms?.message}
          {...register("prenoms")}
        />
      </div>

      <Input
        label="Telephone"
        placeholder="+261 32 11 222 33"
        erreur={errors.tel?.message}
        {...register("tel")}
      />

      <Input
        label="Email"
        type="email"
        placeholder="email@exemple.mg"
        erreur={errors.mail?.message}
        {...register("mail")}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variante="fantome" onClick={onAnnuler}>
          Annuler
        </Button>
        <Button type="submit" variante="primaire" charge={isSubmitting}>
          {estEdition ? "Enregistrer" : "Creer le client"}
        </Button>
      </div>
    </form>
  );
}
