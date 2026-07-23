import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  HandCoins,
  Receipt,
  Settings,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemNav {
  chemin: string;
  libelle: string;
  icone: React.ElementType;
  fin?: boolean;
}

const itemsNavigation: ItemNav[] = [
  { chemin: "/", libelle: "Dashboard", icone: LayoutDashboard },
  { chemin: "/clients", libelle: "Clients", icone: Users },
  { chemin: "/virements", libelle: "Virements", icone: ArrowRightLeft },
  { chemin: "/prets", libelle: "Prets", icone: HandCoins },
  { chemin: "/rendus", libelle: "Remboursements", icone: Receipt },
  { chemin: "/benefice", libelle: "Benefice banque", icone: CircleDollarSign },
];

const itemsFin: ItemNav[] = [
  { chemin: "/parametres", libelle: "Parametres", icone: Settings, fin: true },
];

export function Sidebar() {
  return (
    <aside className="w-60 bg-bgSurface h-full flex flex-col border-r border-border">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
            <span className="text-black font-bold text-base">B</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-textPrimary leading-none">
              Banque
            </h1>
            <p className="text-xs text-textSecondary mt-0.5">Desktop</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {itemsNavigation.map((item) => (
            <li key={item.chemin}>
              <ItemNavigation item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <ul className="space-y-1">
          {itemsFin.map((item) => (
            <li key={item.chemin}>
              <ItemNavigation item={item} />
            </li>
          ))}
        </ul>

      </div>
    </aside>
  );
}

function ItemNavigation({ item }: { item: ItemNav }) {
  const Icone = item.icone;
  return (
    <NavLink
      to={item.chemin}
      end={item.chemin === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md",
          "transition-colors duration-150",
          isActive
            ? "bg-bgElevated text-textPrimary font-bold text-sm"
            : "text-textSecondary hover:text-textPrimary hover:bg-bgElevated text-sm font-normal"
        )
      }
    >
      <Icone size={18} strokeWidth={2} />
      <span>{item.libelle}</span>
    </NavLink>
  );
}
