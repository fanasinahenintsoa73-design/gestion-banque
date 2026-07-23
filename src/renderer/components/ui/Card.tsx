import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  eleve?: boolean;
  enSurbrillance?: boolean;
}

export function Card({
  eleve = false,
  enSurbrillance = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-bgSurface rounded-lg p-6",
        eleve && "shadow-md",
        enSurbrillance && "hover:bg-bgElevated transition-colors duration-150",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  titre: string;
  sousTitre?: string;
  action?: React.ReactNode;
}

export function CardHeader({ titre, sousTitre, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)} {...props}>
      <div>
        <h3 className="text-lg font-semibold text-textPrimary leading-tight">{titre}</h3>
        {sousTitre && (
          <p className="text-sm text-textSecondary mt-1">{sousTitre}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
