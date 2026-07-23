import React from "react";
import { cn } from "@/lib/utils";

interface TableProps<T> {
  donnees: T[];
  colonnes: {
    cle: keyof T | string;
    libelle: string;
    rendu?: (ligne: T) => React.ReactNode;
    largeur?: string;
    alignement?: "gauche" | "centre" | "droite";
  }[];
  clePrimaire: keyof T;
  surClicLigne?: (ligne: T) => void;
  messageVide?: string;
  enChargement?: boolean;
}

const classesAlignement = {
  gauche: "text-left",
  centre: "text-center",
  droite: "text-right",
};

export function Table<T extends object>({
  donnees,
  colonnes,
  clePrimaire,
  surClicLigne,
  messageVide = "Aucune donnee",
  enChargement = false,
}: TableProps<T>) {
  if (enChargement) {
    return (
      <div className="bg-bgSurface rounded-lg p-12 flex items-center justify-center">
        <div className="flex items-center gap-3 text-textSecondary">
          <span className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  if (donnees.length === 0) {
    return (
      <div className="bg-bgSurface rounded-lg p-12 text-center">
        <p className="text-sm text-textSecondary">{messageVide}</p>
      </div>
    );
  }

  return (
    <div className="bg-bgSurface rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {colonnes.map((col) => (
                <th
                  key={String(col.cle)}
                  className={cn(
                    "px-4 py-3 text-xs font-bold uppercase tracking-wider text-textSecondary",
                    classesAlignement[col.alignement || "gauche"]
                  )}
                  style={col.largeur ? { width: col.largeur } : undefined}
                >
                  {col.libelle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {donnees.map((ligne) => (
              <tr
                key={String((ligne as Record<string, unknown>)[clePrimaire as string])}
                onClick={() => surClicLigne?.(ligne)}
                className={cn(
                  "border-b border-border last:border-0",
                  "transition-colors duration-150",
                  surClicLigne && "cursor-pointer hover:bg-bgElevated"
                )}
              >
                {colonnes.map((col) => (
                  <td
                    key={String(col.cle)}
                    className={cn(
                      "px-4 py-3 text-sm text-textPrimary",
                      classesAlignement[col.alignement || "gauche"]
                    )}
                  >
                    {col.rendu
                      ? col.rendu(ligne)
                      : ((ligne as Record<string, unknown>)[col.cle as string] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
