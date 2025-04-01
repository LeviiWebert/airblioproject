
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BackOfficeLayout } from "./components/layout/BackOfficeLayout";
import { ClientLayout } from "./components/layout/ClientLayout";
import Dashboard from "./pages/Dashboard";
import InterventionsPage from "./pages/InterventionsPage";
import InterventionRequests from "./pages/InterventionRequests";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import ClientDashboard from "./pages/client/ClientDashboard";
import Contact from "./pages/Contact";
import RequestIntervention from "./pages/intervention/RequestIntervention";
import InterventionDetails from "./pages/intervention/InterventionDetails";
import InterventionSchedule from "./pages/intervention/InterventionSchedule";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserType(session?.user?.user_metadata?.user_type || null);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserType(session?.user?.user_metadata?.user_type || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Pages publiques */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Routes de demande d'intervention */}
            <Route path="/intervention/request" element={<RequestIntervention />} />
            <Route path="/intervention/details" element={<InterventionDetails />} />
            <Route path="/intervention/schedule" element={<InterventionSchedule />} />
            
            {/* Routes du back-office (admin) */}
            <Route path="/admin" element={
              session && userType === "admin" ? (
                <BackOfficeLayout>
                  <Dashboard />
                </BackOfficeLayout>
              ) : (
                <Auth />
              )
            } />
            <Route path="/admin/interventions" element={
              session && userType === "admin" ? (
                <BackOfficeLayout>
                  <InterventionsPage />
                </BackOfficeLayout>
              ) : (
                <Auth />
              )
            } />
            <Route path="/admin/interventions/requests" element={
              session && userType === "admin" ? (
                <BackOfficeLayout>
                  <InterventionRequests />
                </BackOfficeLayout>
              ) : (
                <Auth />
              )
            } />
            
            {/* Routes du front-office (client) */}
            <Route path="/client-dashboard" element={
              session && userType === "client" ? (
                <ClientLayout>
                  <ClientDashboard />
                </ClientLayout>
              ) : (
                <Auth />
              )
            } />
            <Route path="/client/requests" element={
              session && userType === "client" ? (
                <ClientLayout>
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Mes demandes d'intervention</h1>
                    {/* Contenu à implémenter plus tard */}
                  </div>
                </ClientLayout>
              ) : (
                <Auth />
              )
            } />
            <Route path="/client/interventions" element={
              session && userType === "client" ? (
                <ClientLayout>
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Mes interventions en cours</h1>
                    {/* Contenu à implémenter plus tard */}
                  </div>
                </ClientLayout>
              ) : (
                <Auth />
              )
            } />
            
            {/* Pour compatibilité avec l'ancienne structure */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
