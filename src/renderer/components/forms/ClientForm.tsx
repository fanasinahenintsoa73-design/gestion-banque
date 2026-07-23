import { useEffect, useState, useCallback } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaClient, type ClientFormValues } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatMontant } from "@/lib/utils";
import { Lock } from "lucide-react";
import type { Client } from "@shared/types";

const PREFIXE_TEL = "+261 ";
const FORMAT_TEL = [2, 2, 3, 2];

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
  const [telErreurSaisie, setTelErreurSaisie] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(schemaClient),
    mode: "onChange",
    defaultValues: clientExistant
      ? {
          numCompte: clientExistant.numCompte,
          nom: clientExistant.nom,
          prenoms: clientExistant.prenoms,
          tel: clientExistant.tel,
          mail: clientExistant.mail,
          solde: clientExistant.solde,
        }
      : {
          numCompte: "",
          nom: "",
          prenoms: "",
          tel: PREFIXE_TEL,
          mail: "",
          solde: 0,
        },
  });

  const {
    field: { ref: telRef, value: telValue, onChange: telOnChange, onBlur: telOnBlur, name: telName },
  } = useController({ name: "tel", control });

  useEffect(() => {
    if (clientExistant) {
      reset({
        numCompte: clientExistant.numCompte,
        nom: clientExistant.nom,
        prenoms: clientExistant.prenoms,
        tel: clientExistant.tel,
        mail: clientExistant.mail,
        solde: clientExistant.solde,
      });
    }
  }, [clientExistant, reset]);

  const formaterTel = useCallback((raw: string): string => {
    let suffixe = raw;
    if (!suffixe.startsWith(PREFIXE_TEL)) {
      suffixe = PREFIXE_TEL;
    } else {
      suffixe = suffixe.slice(PREFIXE_TEL.length);
    }

    const aInvalides = /[^0-9\s]/.test(suffixe);
    if (aInvalides) {
      setTelErreurSaisie("Ce champ ne doit contenir que des chiffres");
    } else {
      setTelErreurSaisie("");
    }

    const chiffres = suffixe.replace(/\D/g, "").slice(0, 9);

    let formate = "";
    let idx = 0;
    for (let g = 0; g < FORMAT_TEL.length; g++) {
      if (g > 0 && idx < chiffres.length) formate += " ";
      for (let d = 0; d < FORMAT_TEL[g] && idx < chiffres.length; d++) {
        formate += chiffres[idx];
        idx++;
      }
    }

    return PREFIXE_TEL + formate;
  }, []);

  const handleTelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formate = formaterTel(e.target.value);
      telOnChange(formate);
    },
    [formaterTel, telOnChange]
  );

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
      solde: estEdition ? clientExistant!.solde : data.solde,
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
        ref={telRef}
        name={telName}
        value={telValue}
        onChange={handleTelChange}
        onBlur={telOnBlur}
        erreur={telErreurSaisie || errors.tel?.message}
      />

      <Input
        label="Email"
        type="email"
        placeholder="email@exemple.mg"
        erreur={errors.mail?.message}
        {...register("mail")}
      />

      {estEdition ? (
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-textSecondary mb-1.5 block">
            Solde actuel
          </label>
          <div className="h-11 bg-bgElevated rounded-md px-4 flex items-center justify-between">
            <span className="text-textPrimary font-bold">
              {formatMontant(clientExistant?.solde ?? 0)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-textSecondary">
              <Lock size={12} />
              <span>Calcule automatiquement</span>
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1.5 px-2">
            Le solde evolue selon les virements et prets. Pour le modifier,
            annulez ou creez des transactions.
          </p>
        </div>
      ) : (
        <Input
          label="Solde initial (Ar)"
          type="number"
          placeholder="0"
          erreur={errors.solde?.message}
          texteAide="Montant de depart du compte. Par defaut : 0 Ar. Le client peut ensuite recevoir des virements ou faire des prets."
          {...register("solde", { valueAsNumber: true })}
        />
      )}

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
