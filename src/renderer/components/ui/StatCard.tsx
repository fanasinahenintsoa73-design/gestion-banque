import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  titre: string;
  valeur: string | number;
  sousTexte?: string;
  icone?: LucideIcon;
  variation?: string;
  varianteVariation?: "positive" | "negative" | "neutre";
}

const classesVariation = {
  positive: "text-accent",
  negative: "text-error",
  neutre: "text-textSecondary",
};

export function StatCard({
  titre,
  valeur,
  sousTexte,
  icone: Icone,
  variation,
  varianteVariation = "neutre",
}: StatCardProps) {
  return (
    <div className="bg-bgSurface rounded-lg p-5 hover:bg-bgElevated transition-colors duration-150">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
          {titre}
        </span>
        {Icone && (
          <div className="w-8 h-8 rounded-full bg-bgElevated flex items-center justify-center">
            <Icone size={14} className="text-textSecondary" strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-textPrimary leading-none mb-2">
        {valeur}
      </div>
      {(sousTexte || variation) && (
        <div className="flex items-center gap-2 text-xs">
          {variation && (
            <span className={cn("font-bold", classesVariation[varianteVariation])}>
              {variation}
            </span>
          )}
          {sousTexte && (
            <span className="text-textSecondary">{sousTexte}</span>
          )}
        </div>
      )}
    </div>
  );
}
