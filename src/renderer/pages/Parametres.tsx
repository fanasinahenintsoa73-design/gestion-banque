import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";

export default function Parametres() {
  const [stats, setStats] = useState<{
    clients: number;
    prets: number;
    virements: number;
    rendus: number;
  } | null>(null);

  useEffect(() => {
    window.api.db.stats().then(setStats);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parametres</h1>
        <p className="text-sm text-textSecondary mt-1">
          Bilan de l'application
        </p>
      </div>

      <Card>
        <CardHeader
          titre="Bilan"
          action={<Info size={18} className="text-textSecondary" />}
        />
        {stats ? (
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-bgElevated rounded-md">
              <p className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-1">
                Clients
              </p>
              <p className="text-2xl font-bold">{stats.clients}</p>
            </div>
            <div className="p-3 bg-bgElevated rounded-md">
              <p className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-1">
                Virements
              </p>
              <p className="text-2xl font-bold">{stats.virements}</p>
            </div>
            <div className="p-3 bg-bgElevated rounded-md">
              <p className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-1">
                Prets
              </p>
              <p className="text-2xl font-bold">{stats.prets}</p>
            </div>
            <div className="p-3 bg-bgElevated rounded-md">
              <p className="text-xs text-textSecondary uppercase tracking-wider font-bold mb-1">
                Remboursements
              </p>
              <p className="text-2xl font-bold">{stats.rendus}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-textSecondary text-center py-4">
            Chargement...
          </p>
        )}
      </Card>
    </div>
  );
}
