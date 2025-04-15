
import { lazy } from "react";
import { Route, Outlet, RouteObject } from "react-router-dom";
import { BackOfficeLayout } from "@/components/layout/BackOfficeLayout";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

// Pages avec chargement différé
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const InterventionsPage = lazy(() => import("@/pages/InterventionsPage"));
const InterventionRequests = lazy(() => import("@/pages/InterventionRequests"));
const NewInterventionPage = lazy(() => import("@/pages/admin/NewInterventionPage"));
const AdminInterventionDetails = lazy(() => import("@/pages/admin/AdminInterventionDetails"));
const TeamsPage = lazy(() => import("@/pages/admin/TeamsPage"));
const EquipmentPage = lazy(() => import("@/pages/admin/EquipmentPage"));
const ClientsPage = lazy(() => import("@/pages/admin/ClientsPage"));
const ReportsPage = lazy(() => import("@/pages/admin/ReportsPage"));
const LogisticsPage = lazy(() => import("@/pages/admin/LogisticsPage"));
const BillingPage = lazy(() => import("@/pages/admin/BillingPage"));
const ProcessVerbalPage = lazy(() => import("@/pages/admin/ProcessVerbalPage"));
const StatisticsPage = lazy(() => import("@/pages/StatisticsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

// Convert Route to RouteObject for proper typing
const adminRoutes: RouteObject = {
  path: "/admin",
  element: (
    <ProtectedAdminRoute>
      <BackOfficeLayout>
        <Outlet />
      </BackOfficeLayout>
    </ProtectedAdminRoute>
  ),
  children: [
    { index: true, element: <Dashboard /> },
    { path: "interventions", element: <InterventionsPage /> },
    { path: "interventions/new", element: <NewInterventionPage /> },
    { path: "intervention/:id", element: <AdminInterventionDetails /> },
    { path: "intervention-requests", element: <InterventionRequests /> },
    { path: "teams", element: <TeamsPage /> },
    { path: "equipment", element: <EquipmentPage /> },
    { path: "clients", element: <ClientsPage /> },
    { path: "reports", element: <ReportsPage /> },
    { path: "logistics", element: <LogisticsPage /> },
    { path: "billing", element: <BillingPage /> },
    { path: "pv/:id", element: <ProcessVerbalPage /> },
    { path: "statistics", element: <StatisticsPage /> },
    { path: "settings", element: <SettingsPage /> }
  ]
};

export default adminRoutes;
