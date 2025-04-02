
import { ReactNode, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ClientHeader } from "./client/ClientHeader";
import { ClientSidebar } from "./client/ClientSidebar";
import { Loading } from "@/components/ui/loading";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { userName, isLoading, isAuthChecked, handleLogout } = useClientAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Vérification supplémentaire de la session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session && isAuthChecked) {
        console.log("Pas de session active dans ClientLayout, redirection vers /auth");
        navigate('/auth');
      }
    };
    
    if (isAuthChecked) {
      checkSession();
    }
  }, [isAuthChecked, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Only show loading during initial auth check
  if (isLoading && !isAuthChecked) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <ClientHeader 
        userName={userName} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <ClientSidebar 
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        
        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'} pt-16`}>
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
};

export default ClientLayout;
