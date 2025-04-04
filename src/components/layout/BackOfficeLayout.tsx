
import { ReactNode, useState, useEffect } from "react";
import { SidebarNav } from "./SidebarNav";
import { TopNav } from "./TopNav";
import { Toaster } from "@/components/ui/toaster";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    // Vérifier si l'utilisateur est connecté et est un admin
    const checkAdminAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          toast.error("Session expirée. Veuillez vous reconnecter.");
          navigate('/auth');
          return;
        }
        
        // Vérifier le type d'utilisateur
        const userEmail = data.session.user.email;
        const userMetadata = data.session.user.user_metadata;
        
        // Vérifier d'abord le metadata
        if (userMetadata?.user_type === 'admin') {
          return; // L'utilisateur est un admin, continuer
        }
        
        // Vérifier par email conventionnel
        if (userEmail === "leviwebert147@gmail.com" || userEmail?.includes("admin")) {
          return; // L'utilisateur est un admin, continuer
        }
        
        // Vérifier dans la base de données
        const { data: adminData, error } = await supabase
          .from('utilisateurs')
          .select('role')
          .eq('email', userEmail)
          .eq('role', 'admin')
          .maybeSingle();
          
        if (error || !adminData) {
          toast.error("Accès non autorisé. Vous n'avez pas les droits administrateur.");
          navigate('/auth');
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des droits admin:", error);
        toast.error("Erreur de vérification des droits d'accès");
        navigate('/auth');
      }
    };

    checkAdminAuth();
  }, [navigate]);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Vous avez été déconnecté avec succès");
      navigate('/auth');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
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
