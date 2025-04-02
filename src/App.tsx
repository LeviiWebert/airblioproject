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
    const checkUserType = async (userId: string) => {
      try {
        // Vérifier d'abord si l'utilisateur est un admin
        const { data: adminData } = await supabase
          .from('utilisateurs')
          .select('role')
          .eq('id', userId)
          .eq('role', 'admin')
          .single();

        if (adminData) {
          console.log("Utilisateur identifié comme admin");
          return "admin";
        }

        // Si ce n'est pas un admin, vérifier s'il est un client
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('id', userId)
          .single();

        if (clientData) {
          console.log("Utilisateur identifié comme client");
          return "client";
        }

        // Si l'utilisateur n'est ni client ni admin
        console.log("Utilisateur sans rôle spécifique");
        return null;
      } catch (error) {
        console.error("Erreur lors de la vérification du type d'utilisateur:", error);
        return null;
      }
    };

    // Configurer l'écouteur des changements d'authentification avant de vérifier la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("Changement d'état d'authentification:", _event);
      setSession(newSession);
      
      if (newSession?.user?.id) {
        const type = await checkUserType(newSession.user.id);
        console.log("Nouveau type d'utilisateur:", type);
        setUserType(type);
      } else {
        setUserType(null);
      }
      
      setLoading(false);
    });

    // Récupérer la session existante
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Session initiale:", session);
      setSession(session);
      
      if (session?.user?.id) {
        const type = await checkUserType(session.user.id);
        console.log("Type d'utilisateur déterminé:", type);
        setUserType(type);
      } else {
        setUserType(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirection pendant le chargement
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
            {/* Pages publiques */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Route racine - redirection basée sur le type d'utilisateur */}
            <Route path="/" element={
              session ? (
                userType === "admin" ? <Navigate to="/admin" /> : 
                userType === "client" ? <Navigate to="/client-dashboard" /> : 
                <LandingPage />
              ) : (
                <LandingPage />
              )
            } />
            
            <Route path="/auth" element={
              session ? (
                userType === "admin" ? <Navigate to="/admin" /> : 
                userType === "client" ? <Navigate to="/client-dashboard" /> : 
                <Auth />
              ) : (
                <Auth />
              )
            } />
            <Route path="/login" element={
              session ? (
                userType === "admin" ? <Navigate to="/admin" /> : 
                userType === "client" ? <Navigate to="/client-dashboard" /> : 
                <Login />
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
                session && userType === "client" ? <Navigate to="/client-dashboard" /> : <Navigate to="/auth" />
              )
            } />
            <Route path="/admin/interventions" element={
              session && userType === "admin" ? (
                <BackOfficeLayout>
                  <InterventionsPage />
                </BackOfficeLayout>
              ) : (
                session && userType === "client" ? <Navigate to="/client-dashboard" /> : <Navigate to="/auth" />
              )
            } />
            <Route path="/admin/interventions/requests" element={
              session && userType === "admin" ? (
                <BackOfficeLayout>
                  <InterventionRequests />
                </BackOfficeLayout>
              ) : (
                session && userType === "client" ? <Navigate to="/client-dashboard" /> : <Navigate to="/auth" />
              )
            } />
            
            {/* Routes du front-office (client) */}
            <Route path="/client-dashboard" element={
              session && userType === "client" ? (
                <ClientLayout>
                  <ClientDashboard />
                </ClientLayout>
              ) : (
                session && userType === "admin" ? <Navigate to="/admin" /> : <Navigate to="/auth" />
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
                userType === "admin" ? <Navigate to="/admin" /> : 
                userType === "client" ? <Navigate to="/client-dashboard" /> : 
                <Navigate to="/auth" />
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
