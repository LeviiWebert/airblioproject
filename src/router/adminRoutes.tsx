
import { RouteObject } from "react-router-dom";
import { BackOfficeLayout } from "@/components/layout/BackOfficeLayout";
import Dashboard from "@/pages/Dashboard";
import InterventionsPage from "@/pages/InterventionsPage";
import InterventionRequests from "@/pages/InterventionRequests";
import NewInterventionPage from "@/pages/admin/NewInterventionPage";
import TeamsPage from "@/pages/admin/TeamsPage";
import EquipmentPage from "@/pages/admin/EquipmentPage";
import ClientsPage from "@/pages/admin/ClientsPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import LogisticsPage from "@/pages/admin/LogisticsPage";
import BillingPage from "@/pages/admin/BillingPage";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <Dashboard />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/interventions",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <InterventionsPage />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/interventions/new",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <NewInterventionPage />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/interventions/requests",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <InterventionRequests />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/teams",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <TeamsPage />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/equipment",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <EquipmentPage />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/clients",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <ClientsPage />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/reports",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <ReportsPage />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/logistics",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <LogisticsPage />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/billing",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <BillingPage />
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/statistics",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <div className="p-4">
            <h1 className="text-2xl font-bold">Statistiques</h1>
            <p className="text-muted-foreground">Cette fonctionnalité sera bientôt disponible.</p>
          </div>
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          <div className="p-4">
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground">Cette fonctionnalité sera bientôt disponible.</p>
          </div>
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    ),
  },
];
