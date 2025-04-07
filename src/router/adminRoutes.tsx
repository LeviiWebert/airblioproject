
import { RouteObject } from "react-router-dom";
import { BackOfficeLayout } from "@/components/layout/BackOfficeLayout";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import Dashboard from "@/pages/Dashboard";
import ClientsPage from "@/pages/admin/ClientsPage";
import TeamsPage from "@/pages/admin/TeamsPage";
import EquipmentPage from "@/pages/admin/EquipmentPage";
import BillingPage from "@/pages/admin/BillingPage";
import LogisticsPage from "@/pages/admin/LogisticsPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import InterventionsPage from "@/pages/InterventionsPage";
import InterventionRequests from "@/pages/InterventionRequests";
import NewInterventionPage from "@/pages/admin/NewInterventionPage";
import AdminInterventionDetails from "@/pages/admin/AdminInterventionDetails";
import ProcessVerbalPage from "@/pages/admin/ProcessVerbalPage";

// Helper function to wrap components with protection and layout
const withAdminProtection = (Component: React.ComponentType<any>) => (
  <ProtectedAdminRoute>
    <BackOfficeLayout>
      <Component />
    </BackOfficeLayout>
  </ProtectedAdminRoute>
);

// Admin routes configuration
export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: withAdminProtection(Dashboard)
  },
  {
    path: "/admin/clients",
    element: withAdminProtection(ClientsPage)
  },
  {
    path: "/admin/teams",
    element: withAdminProtection(TeamsPage)
  },
  {
    path: "/admin/equipment",
    element: withAdminProtection(EquipmentPage)
  },
  {
    path: "/admin/billing",
    element: withAdminProtection(BillingPage)
  },
  {
    path: "/admin/logistics",
    element: withAdminProtection(LogisticsPage)
  },
  {
    path: "/admin/reports",
    element: withAdminProtection(ReportsPage)
  },
  {
    path: "/admin/interventions",
    element: withAdminProtection(InterventionsPage)
  },
  {
    path: "/admin/intervention-requests",
    element: withAdminProtection(InterventionRequests)
  },
  {
    path: "/admin/new-intervention",
    element: withAdminProtection(NewInterventionPage)
  },
  {
    path: "/admin/intervention/:id",
    element: withAdminProtection(AdminInterventionDetails)
  },
  {
    path: "/admin/pv/:id",
    element: withAdminProtection(ProcessVerbalPage)
  }
];
