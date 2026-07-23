import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, User, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const titresPages: Record<string, string> = {
  "/": "Dashboard",
  "/clients": "Clients",
  "/virements": "Virements",
  "/prets": "Prets",
  "/rendus": "Remboursements",
  "/benefice": "Benefice banque",
  "/parametres": "Parametres",
};

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [connecte, setConnecte] = useState(true);
  const [recherche, setRecherche] = useState("");

  const titre = titresPages[location.pathname] || "Banque Desktop";

  const lancerRecherche = useCallback(() => {
    const terme = recherche.trim();
    if (!terme) return;
    navigate(`/clients?q=${encodeURIComponent(terme)}`);
  }, [recherche, navigate]);

  return (
    <header className="h-16 bg-bgSurface border-b border-border px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-xl font-bold text-textPrimary tracking-tight truncate">
          {titre}
        </h2>
      </div>

      <div className="flex-1 max-w-md">
        <Input
          placeholder="Rechercher un client..."
          iconeGauche={<Search size={16} />}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") lancerRecherche(); }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setConnecte(!connecte)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full",
            "bg-bgElevated hover:bg-bgCard transition-colors"
          )}
          title="Etat de la base de donnees"
        >
          {connecte ? (
            <Wifi size={14} className="text-accent" />
          ) : (
            <WifiOff size={14} className="text-error" />
          )}
          <span className="text-xs font-semibold text-textSecondary">
            {connecte ? "Base OK" : "Deconnecte"}
          </span>
        </button>

        <button className="w-9 h-9 rounded-full bg-bgElevated hover:bg-bgCard flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-9 h-9 rounded-full bg-bgElevated flex items-center justify-center">
            <User size={16} className="text-textSecondary" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-textPrimary leading-none">
              Admin
            </p>
            <Badge variante="succes" className="mt-1">En ligne</Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
