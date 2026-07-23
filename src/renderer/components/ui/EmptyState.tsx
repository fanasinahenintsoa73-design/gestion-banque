import React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  titre: string;
  description?: string;
  action?: React.ReactNode;
  icone?: React.ReactNode;
  className?: string;
}

export function EmptyState({ titre, description, action, icone, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-16 px-6",
      "bg-bgSurface rounded-lg",
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-bgElevated flex items-center justify-center text-textSecondary mb-4">
        {icone || <Inbox size={28} strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold text-textPrimary mb-1">{titre}</h3>
      {description && (
        <p className="text-sm text-textSecondary max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
