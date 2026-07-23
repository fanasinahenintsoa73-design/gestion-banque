import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  taille?: "sm" | "md" | "lg";
}

const classesTaille = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({
  ouvert,
  onFermer,
  titre,
  description,
  children,
  actions,
  taille = "md",
}: ModalProps) {
  useEffect(() => {
    if (!ouvert) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onFermer}
    >
      <div
        className={cn(
          "w-full bg-bgSurface rounded-lg shadow-lg",
          "flex flex-col max-h-[90vh]",
          classesTaille[taille]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-textPrimary leading-tight">
              {titre}
            </h2>
            {description && (
              <p className="text-sm text-textSecondary mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onFermer}
            className="w-8 h-8 rounded-full bg-bgElevated hover:bg-bgCard flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {actions && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
