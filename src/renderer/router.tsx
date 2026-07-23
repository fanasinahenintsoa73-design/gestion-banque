import { createHashRouter, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Virements from "@/pages/Virements";
import Prets from "@/pages/Prets";
import Remboursements from "@/pages/Remboursements";
import Benefice from "@/pages/Benefice";
import Parametres from "@/pages/Parametres";

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "clients", element: <Clients /> },
      { path: "virements", element: <Virements /> },
      { path: "prets", element: <Prets /> },
      { path: "rendus", element: <Remboursements /> },
      { path: "benefice", element: <Benefice /> },
      { path: "parametres", element: <Parametres /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
