
import { lazy, Suspense } from "react";
import { RouteObject, Outlet } from "react-router-dom";
import { BackOfficeLayout } from "@/components/layout/BackOfficeLayout";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Composant de chargement
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-[calc(100vh-200px)]">
    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
    <p className="mt-4 text-muted-foreground">Chargement…</p>
  </div>
);

// Pages lazy (chargement différé)
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

// Helper simple pour chaque page : ErrorBoundary + Suspense court
function withBoundary(element: React.ReactNode) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        {element}
      </Suspense>
    </ErrorBoundary>
  );
}

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
    { index: true, element: withBoundary(<Dashboard />) },
    { path: "interventions", element: withBoundary(<InterventionsPage />) },
    { path: "interventions/new", element: withBoundary(<NewInterventionPage />) },
    { path: "intervention/:id", element: withBoundary(<AdminInterventionDetails />) },
    { path: "intervention-requests", element: withBoundary(<InterventionRequests />) },
    { path: "teams", element: withBoundary(<TeamsPage />) },
    { path: "equipment", element: withBoundary(<EquipmentPage />) },
    { path: "clients", element: withBoundary(<ClientsPage />) },
    { path: "reports", element: withBoundary(<ReportsPage />) },
    { path: "logistics", element: withBoundary(<LogisticsPage />) },
    { path: "billing", element: withBoundary(<BillingPage />) },
    { path: "pv/:id", element: withBoundary(<ProcessVerbalPage />) },
    { path: "statistics", element: withBoundary(<StatisticsPage />) },
    { path: "settings", element: withBoundary(<SettingsPage />) },
  ]
};

export default adminRoutes;

