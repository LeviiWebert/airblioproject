
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BackOfficeLayout } from "./components/layout/BackOfficeLayout";
import { ClientLayout } from "./components/layout/ClientLayout";
import Dashboard from "./pages/Dashboard";
import InterventionsPage from "./pages/InterventionsPage";
import InterventionRequests from "./pages/InterventionRequests";
import NewInterventionPage from "./pages/admin/NewInterventionPage";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import ClientDashboard from "./pages/client/ClientDashboard";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import RequestIntervention from "./pages/intervention/RequestIntervention";
import InterventionDetails from "./pages/intervention/InterventionDetails";
import InterventionSchedule from "./pages/intervention/InterventionSchedule";
import InterventionRecap from "./pages/client/InterventionRecap";
import ClientProfile from "./pages/client/ClientProfile";
import ClientInterventionsList from "./pages/client/InterventionsList";
import ClientInterventionDetails from "./pages/client/InterventionDetails";
import Index from "./pages/Index";
import { ProtectedAdminRoute } from "./components/auth/ProtectedAdminRoute";
import { ProtectedClientRoute } from "./components/auth/ProtectedClientRoute";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import TeamsPage from "./pages/admin/TeamsPage";
import EquipmentPage from "./pages/admin/EquipmentPage";
import ClientsPage from "./pages/admin/ClientsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import LogisticsPage from "./pages/admin/LogisticsPage";
import BillingPage from "./pages/admin/BillingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Erreur lors de la récupération de la session:", error);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={session ? <Navigate to="/index" replace /> : <LandingPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={session ? <Navigate to="/index" replace /> : <Auth />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/index" element={session ? <Index /> : <Navigate to="/auth" replace />} />
          <Route path="/intervention/request" element={
            session ? <RequestIntervention /> : <Navigate to="/auth" state={{ returnTo: "/intervention/request" }} />
          } />
          <Route path="/intervention/details" element={
            session ? <InterventionDetails /> : <Navigate to="/auth" />
          } />
          <Route path="/intervention/schedule" element={
            session ? <InterventionSchedule /> : <Navigate to="/auth" />
          } />
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <Dashboard />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/interventions" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <InterventionsPage />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/interventions/new" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <NewInterventionPage />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/interventions/requests" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <InterventionRequests />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/teams" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <TeamsPage />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/equipment" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <EquipmentPage />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/clients" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <ClientsPage />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <ReportsPage />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/logistics" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <LogisticsPage />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/billing" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <BillingPage />
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/statistics" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <div className="p-4">
                  <h1 className="text-2xl font-bold">Statistiques</h1>
                  <p className="text-muted-foreground">Cette fonctionnalité sera bientôt disponible.</p>
                </div>
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedAdminRoute>
              <BackOfficeLayout>
                <div className="p-4">
                  <h1 className="text-2xl font-bold">Paramètres</h1>
                  <p className="text-muted-foreground">Cette fonctionnalité sera bientôt disponible.</p>
                </div>
              </BackOfficeLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/client-dashboard" element={
            <ProtectedClientRoute>
              <ClientLayout>
                <ClientDashboard />
              </ClientLayout>
            </ProtectedClientRoute>
          } />
          <Route path="/client/profile" element={
            <ProtectedClientRoute>
              <ClientLayout>
                <ClientProfile />
              </ClientLayout>
            </ProtectedClientRoute>
          } />
          <Route path="/client/interventions" element={
            <ProtectedClientRoute>
              <ClientLayout>
                <ClientInterventionsList />
              </ClientLayout>
            </ProtectedClientRoute>
          } />
          <Route path="/client/intervention/:id" element={
            <ProtectedClientRoute>
              <ClientLayout>
                <ClientInterventionDetails />
              </ClientLayout>
            </ProtectedClientRoute>
          } />
          <Route path="/client/intervention/recap/:id" element={
            <ProtectedClientRoute>
              <ClientLayout>
                <InterventionRecap />
              </ClientLayout>
            </ProtectedClientRoute>
          } />
          <Route path="/dashboard" element={
            session ? <Navigate to="/index" replace /> : <Navigate to="/auth" replace />
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
