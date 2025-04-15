
import { lazy } from "react";
import { Route } from "react-router-dom";
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

const adminRoutes = (
  <Route 
    path="/admin" 
    element={
      <ProtectedAdminRoute>
        <BackOfficeLayout>
          {/* This ensures the children prop is provided */}
        </BackOfficeLayout>
      </ProtectedAdminRoute>
    }
  >
    <Route index element={<Dashboard />} />
    <Route path="interventions" element={<InterventionsPage />} />
    <Route path="interventions/new" element={<NewInterventionPage />} />
    <Route path="intervention/:id" element={<AdminInterventionDetails />} />
    <Route path="intervention-requests" element={<InterventionRequests />} />
    <Route path="teams" element={<TeamsPage />} />
    <Route path="equipment" element={<EquipmentPage />} />
    <Route path="clients" element={<ClientsPage />} />
    <Route path="reports" element={<ReportsPage />} />
    <Route path="logistics" element={<LogisticsPage />} />
    <Route path="billing" element={<BillingPage />} />
    <Route path="pv/:id" element={<ProcessVerbalPage />} />
    <Route path="statistics" element={<StatisticsPage />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
);

export default adminRoutes;
