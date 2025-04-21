
import { lazy, Suspense } from "react";
import { Route, Outlet, RouteObject } from "react-router-dom";
import { BackOfficeLayout } from "@/components/layout/BackOfficeLayout";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Composant de chargement
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-[calc(100vh-200px)]">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
      <p className="mt-4 text-muted-foreground">Chargement de la page...</p>
    </div>
  </div>
);

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

// Envelopper chaque page dans un ErrorBoundary et Suspense
const withErrorAndSuspense = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

// Convert Route to RouteObject for proper typing
const adminRoutes: RouteObject = {
  path: "/admin",
  element: (
    <ProtectedAdminRoute>
      <BackOfficeLayout>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </BackOfficeLayout>
    </ProtectedAdminRoute>
  ),
  children: [
    { index: true, element: withErrorAndSuspense(Dashboard) },
    { path: "interventions", element: withErrorAndSuspense(InterventionsPage) },
    { path: "interventions/new", element: withErrorAndSuspense(NewInterventionPage) },
    { path: "intervention/:id", element: withErrorAndSuspense(AdminInterventionDetails) },
    { path: "intervention-requests", element: withErrorAndSuspense(InterventionRequests) },
    { path: "teams", element: withErrorAndSuspense(TeamsPage) },
    { path: "equipment", element: withErrorAndSuspense(EquipmentPage) },
    { path: "clients", element: withErrorAndSuspense(ClientsPage) },
    { path: "reports", element: withErrorAndSuspense(ReportsPage) },
    { path: "logistics", element: withErrorAndSuspense(LogisticsPage) },
    { path: "billing", element: withErrorAndSuspense(BillingPage) },
    { path: "pv/:id", element: withErrorAndSuspense(ProcessVerbalPage) },
    { path: "statistics", element: withErrorAndSuspense(StatisticsPage) },
    { path: "settings", element: withErrorAndSuspense(SettingsPage) }
  ]
};

export default adminRoutes;
