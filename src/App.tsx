
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BackOfficeLayout } from "./components/layout/BackOfficeLayout";
import { ClientLayout } from "./components/layout/ClientLayout";
import Dashboard from "./pages/Dashboard";
import InterventionsPage from "./pages/InterventionsPage";
import InterventionRequests from "./pages/InterventionRequests";
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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

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
    // Vérifier la session au chargement initial
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

    // Configurer l'écouteur des changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Afficher un écran de chargement pendant l'initialisation
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Page d'accueil non authentifiée */}
            <Route path="/" element={session ? <Navigate to="/index" replace /> : <LandingPage />} />
            
            {/* Pages accessibles pour tous */}
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={session ? <Navigate to="/index" replace /> : <Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            
            {/* Page d'aiguillage protégée par authentification */}
            <Route path="/index" element={session ? <Index /> : <Navigate to="/auth" replace />} />
            
            {/* Routes de demande d'intervention - protégées par auth */}
            <Route path="/intervention/request" element={
              session ? <RequestIntervention /> : <Navigate to="/auth" state={{ returnTo: "/intervention/request" }} />
            } />
            <Route path="/intervention/details" element={
              session ? <InterventionDetails /> : <Navigate to="/auth" />
            } />
            <Route path="/intervention/schedule" element={
              session ? <InterventionSchedule /> : <Navigate to="/auth" />
            } />
            
            {/* Routes du back-office (admin) - strictement protégées */}
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
            <Route path="/admin/interventions/requests" element={
              <ProtectedAdminRoute>
                <BackOfficeLayout>
                  <InterventionRequests />
                </BackOfficeLayout>
              </ProtectedAdminRoute>
            } />
            
            {/* Routes du front-office (client) - strictement protégées */}
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
            
            {/* Pour compatibilité avec l'ancienne structure */}
            <Route path="/dashboard" element={
              session ? <Navigate to="/index" replace /> : <Navigate to="/auth" replace />
            } />
            
            {/* Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
