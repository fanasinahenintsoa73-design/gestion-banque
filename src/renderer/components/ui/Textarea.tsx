import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  erreur?: string;
  texteAide?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, erreur, texteAide, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-bgElevated text-textPrimary text-sm",
            "rounded-md px-4 py-3 min-h-[88px] resize-y",
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

Textarea.displayName = "Textarea";
