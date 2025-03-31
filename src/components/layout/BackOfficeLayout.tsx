
import { ReactNode, useState, useEffect } from "react";
import { SidebarNav } from "./SidebarNav";
import { TopNav } from "./TopNav";
import { Toaster } from "@/components/ui/toaster";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface BackOfficeLayoutProps {
  children: ReactNode;
}

export const BackOfficeLayout = ({ children }: BackOfficeLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <TopNav 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen} 
        onLogout={handleLogout}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav isOpen={sidebarOpen} />
        
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
};
