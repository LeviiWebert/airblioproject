
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
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import ClientDashboard from "./pages/client/ClientDashboard";
import Contact from "./pages/Contact";
import RequestIntervention from "./pages/intervention/RequestIntervention";
import InterventionDetails from "./pages/intervention/InterventionDetails";
import InterventionSchedule from "./pages/intervention/InterventionSchedule";
import InterventionRecap from "./pages/client/InterventionRecap";
import ClientProfile from "./pages/client/ClientProfile";
import ClientInterventionsList from "./pages/client/InterventionsList";
import ClientInterventionDetails from "./pages/client/InterventionDetails";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Session initiale:", session);
      setSession(session);
      
      if (session?.user?.user_metadata) {
        const type = session.user.user_metadata.user_type || null;
        console.log("Type d'utilisateur:", type);
        setUserType(type);
      }
      
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Changement d'état d'authentification:", _event);
      setSession(session);
      
      if (session?.user?.user_metadata) {
        const type = session.user.user_metadata.user_type || null;
        console.log("Nouveau type d'utilisateur:", type);
        setUserType(type);
      } else {
        setUserType(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Pages publiques */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={
              session ? (
                userType === "admin" ? <Navigate to="/admin" /> : <Navigate to="/client-dashboard" />
              ) : (
                <Auth />
              )
            } />
            <Route path="/login" element={
              session ? (
                userType === "admin" ? <Navigate to="/admin" /> : <Navigate to="/client-dashboard" />
              ) : (
                <Login />
              )
            } />
            <Route path="/contact" element={<Contact />} />
            
            {/* Routes de demande d'intervention */}
            <Route path="/intervention/request" element={
              session ? <RequestIntervention /> : <Navigate to="/auth" />
            } />
            <Route path="/intervention/details" element={
              session ? <InterventionDetails /> : <Navigate to="/auth" />
            } />
            <Route path="/intervention/schedule" element={
              session ? <InterventionSchedule /> : <Navigate to="/auth" />
            } />
            
            {/* Routes du back-office (admin) */}
            <Route path="/admin" element={
              session && userType === "admin" ? (
                <BackOfficeLayout>
                  <Dashboard />
                </BackOfficeLayout>
              ) : (
                session && userType !== "admin" ? <Navigate to="/client-dashboard" /> : <Navigate to="/auth" />
              )
            } />
            <Route path="/admin/interventions" element={
              session && userType === "admin" ? (
                <BackOfficeLayout>
                  <InterventionsPage />
                </BackOfficeLayout>
              ) : (
                session && userType !== "admin" ? <Navigate to="/client-dashboard" /> : <Navigate to="/auth" />
              )
            } />
            <Route path="/admin/interventions/requests" element={
              session && userType === "admin" ? (
                <BackOfficeLayout>
                  <InterventionRequests />
                </BackOfficeLayout>
              ) : (
                session && userType !== "admin" ? <Navigate to="/client-dashboard" /> : <Navigate to="/auth" />
              )
            } />
            
            {/* Routes du front-office (client) */}
            <Route path="/client-dashboard" element={
              session && userType === "client" ? (
                <ClientLayout>
                  <ClientDashboard />
                </ClientLayout>
              ) : (
                session && userType !== "client" ? <Navigate to="/admin" /> : <Navigate to="/auth" />
              )
            } />
            <Route path="/client/profile" element={
              session && userType === "client" ? (
                <ClientLayout>
                  <ClientProfile />
                </ClientLayout>
              ) : (
                <Navigate to="/auth" />
              )
            } />
            <Route path="/client/interventions" element={
              session && userType === "client" ? (
                <ClientLayout>
                  <ClientInterventionsList />
                </ClientLayout>
              ) : (
                <Navigate to="/auth" />
              )
            } />
            <Route path="/client/intervention/:id" element={
              session && userType === "client" ? (
                <ClientLayout>
                  <ClientInterventionDetails />
                </ClientLayout>
              ) : (
                <Navigate to="/auth" />
              )
            } />
            
            {/* Nouvelle route pour le récapitulatif d'intervention */}
            <Route path="/client/intervention/recap/:id" element={
              session && userType === "client" ? (
                <ClientLayout>
                  <InterventionRecap />
                </ClientLayout>
              ) : (
                <Navigate to="/auth" />
              )
            } />
            
            {/* Pour compatibilité avec l'ancienne structure */}
            <Route path="/dashboard" element={
              session ? (
                userType === "admin" ? <Navigate to="/admin" /> : <Navigate to="/client-dashboard" />
              ) : (
                <Navigate to="/auth" />
              )
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
