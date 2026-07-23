import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type VarianteAlert = "info" | "succes" | "avertissement" | "erreur";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variante?: VarianteAlert;
  titre?: string;
  fermable?: boolean;
  onFermer?: () => void;
}

const configVariante: Record<VarianteAlert, {
  classes: string;
  icone: typeof Info;
}> = {
  info: {
    classes: "bg-info/10 text-info border-l-2 border-info",
    icone: Info,
  },
  succes: {
    classes: "bg-accent/10 text-accent border-l-2 border-accent",
    icone: CheckCircle2,
  },
  avertissement: {
    classes: "bg-warning/10 text-warning border-l-2 border-warning",
    icone: AlertTriangle,
  },
  erreur: {
    classes: "bg-error/10 text-error border-l-2 border-error",
    icone: AlertCircle,
  },
};

export function Alert({
  variante = "info",
  titre,
  fermable = false,
  onFermer,
  className,
  children,
  ...props
}: AlertProps) {
  const config = configVariante[variante];
  const Icone = config.icone;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-md",
        config.classes,
        className
      )}
      role="alert"
      {...props}
    >
      <Icone size={20} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {titre && (
          <p className="text-sm font-bold mb-1">{titre}</p>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {fermable && onFermer && (
        <button
          onClick={onFermer}
          className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-black/20 flex items-center justify-center transition-colors"
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
