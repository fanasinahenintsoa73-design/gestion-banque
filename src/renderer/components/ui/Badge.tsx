import React from "react";
import { cn } from "@/lib/utils";

type VarianteBadge = "neutre" | "succes" | "erreur" | "avertissement" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variante?: VarianteBadge;
}

const classesBadge: Record<VarianteBadge, string> = {
  neutre: "bg-bgElevated text-textSecondary",
  succes: "bg-accent/20 text-accent",
  erreur: "bg-error/20 text-error",
  avertissement: "bg-warning/20 text-warning",
  info: "bg-info/20 text-info",
};

export function Badge({ variante = "neutre", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold capitalize",
        classesBadge[variante],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
