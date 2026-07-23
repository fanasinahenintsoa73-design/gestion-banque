import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  erreur?: string;
  texteAide?: string;
  iconeGauche?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, erreur, texteAide, iconeGauche, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">
            {label}
          </label>
        )}
        <div className="relative">
          {iconeGauche && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none">
              {iconeGauche}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-11 bg-bgElevated text-textPrimary text-sm",
              "rounded-full px-5",
              iconeGauche && "pl-12",
              "placeholder:text-textSecondary placeholder:font-normal",
              "border-0",
              "transition-all duration-150",
              "focus:outline-none focus:bg-bgCard",
              "focus:shadow-[inset_rgb(124,124,124)_0px_0px_0px_1px]",
              erreur && "shadow-[inset_rgb(243,114,127)_0px_0px_0px_1px]",
              className
            )}
            {...props}
          />
        </div>
        {erreur && (
          <span className="text-xs text-error font-medium px-2">{erreur}</span>
        )}
        {texteAide && !erreur && (
          <span className="text-xs text-textSecondary px-2">{texteAide}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  erreur?: string;
  options: { valeur: string; libelle: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, erreur, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full h-11 bg-bgElevated text-textPrimary text-sm",
            "rounded-md px-4",
            "border-0",
            "transition-all duration-150",
            "focus:outline-none focus:bg-bgCard",
            "focus:shadow-[inset_rgb(124,124,124)_0px_0px_0px_1px]",
            erreur && "shadow-[inset_rgb(243,114,127)_0px_0px_0px_1px]",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.valeur} value={opt.valeur} className="bg-bgSurface">
              {opt.libelle}
            </option>
          ))}
        </select>
        {erreur && (
          <span className="text-xs text-error font-medium px-2">{erreur}</span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
