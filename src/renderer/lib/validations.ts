import { z } from "zod";

export const schemaClient = z.object({
  numCompte: z
    .string()
    .min(3, "Minimum 3 caracteres")
    .max(20, "Maximum 20 caracteres")
    .regex(/^[A-Za-z0-9-]+$/, "Caracteres alphanumeriques et tirets uniquement"),
  nom: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(50)
    .regex(/^[\p{L}\s-]+$/u, "Lettres uniquement (pas de chiffres)"),
  prenoms: z
    .string()
    .min(1, "Les prenoms sont obligatoires")
    .max(100)
    .regex(/^[\p{L}\s-]+$/u, "Lettres uniquement (pas de chiffres)"),
  tel: z
    .string()
    .min(6, "Numero de telephone invalide")
    .max(20)
    .regex(/^[+\d\s().-]+$/, "Caracteres telephone invalides"),
  mail: z.string().email("Adresse email invalide").max(100, "Maximum 100 caracteres"),
  solde: z
    .number({ invalid_type_error: "Solde invalide" })
    .int("Le solde doit etre un entier")
    .nonnegative("Le solde ne peut pas etre negatif")
    .default(0),
});

export type ClientFormValues = z.infer<typeof schemaClient>;

export const schemaPret = z.object({
  numPret: z
    .string()
    .min(1, "Numero de pret obligatoire")
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "Caracteres alphanumeriques et tirets uniquement"),
  numCompte: z.string().min(1, "Veuillez selectionner un client"),
  montantPret: z
    .number({ invalid_type_error: "Montant invalide" })
    .int("Le montant doit etre un entier")
    .positive("Le montant doit etre strictement positif"),
  datePret: z.string().min(1, "Date obligatoire"),
});

export type PretFormValues = z.infer<typeof schemaPret>;

export const schemaRemboursement = z.object({
  numRendu: z
    .string()
    .min(1, "Numero obligatoire")
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "Caracteres alphanumeriques et tirets uniquement"),
  numPret: z.string().min(1, "Veuillez selectionner un pret"),
  restPaye: z
    .number({ invalid_type_error: "Montant invalide" })
    .int("Le montant doit etre un entier")
    .nonnegative("Le montant doit etre positif ou nul"),
  dateRendu: z.string().min(1, "Date obligatoire"),
});

export type RemboursementFormValues = z.infer<typeof schemaRemboursement>;

export function calculerCommission(montant: number): number {
  return Math.round(montant * 0.1);
}

export function calculerNet(montant: number): number {
  return montant - calculerCommission(montant);
}
