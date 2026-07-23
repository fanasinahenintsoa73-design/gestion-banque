import React from "react";
import { cn } from "@/lib/utils";

type Variante = "primaire" | "secondaire" | "fantome" | "danger" | "contour";
type Taille = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  taille?: Taille;
  iconeGauche?: React.ReactNode;
  iconeDroite?: React.ReactNode;
  charge?: boolean;
  pleinLargeur?: boolean;
}

const classesVariante: Record<Variante, string> = {
  primaire:
    "bg-accent text-black hover:bg-accentDark active:scale-[0.98] shadow-md",
  secondaire:
    "bg-bgElevated text-textPrimary hover:bg-bgCard active:scale-[0.98]",
  fantome:
    "bg-transparent text-textSecondary hover:text-textPrimary hover:bg-bgElevated",
  danger:
    "bg-error text-black hover:opacity-90 active:scale-[0.98]",
  contour:
    "bg-transparent text-textPrimary border border-borderLight hover:border-textPrimary hover:bg-bgElevated",
};

const classesTaille: Record<Taille, string> = {
  sm: "h-8 px-4 text-xs",
  md: "h-10 px-6 text-sm",
  lg: "h-12 px-10 text-sm",
};

export function Button({
  variante = "primaire",
  taille = "md",
  iconeGauche,
  iconeDroite,
  charge = false,
  pleinLargeur = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || charge}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "rounded-full font-bold uppercase tracking-wider",
        "transition-all duration-150 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bgBase",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        classesVariante[variante],
        classesTaille[taille],
        pleinLargeur && "w-full",
        className
      )}
      {...props}
    >
      {charge ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        iconeGauche
      )}
      {children}
      {!charge && iconeDroite}
    </button>
  );
}
