
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BackOfficeLayout } from "./components/layout/BackOfficeLayout";
import Dashboard from "./pages/Dashboard";
import InterventionsPage from "./pages/InterventionsPage";
import InterventionRequests from "./pages/InterventionRequests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <BackOfficeLayout>
              <Dashboard />
            </BackOfficeLayout>
          } />
          <Route path="/interventions" element={
            <BackOfficeLayout>
              <InterventionsPage />
            </BackOfficeLayout>
          } />
          <Route path="/interventions/requests" element={
            <BackOfficeLayout>
              <InterventionRequests />
            </BackOfficeLayout>
          } />
          {/* Autres routes à ajouter ici */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
