
import { ReactNode, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ClientHeader } from "./client/ClientHeader";
import { ClientSidebar } from "./client/ClientSidebar";
import { Loading } from "@/components/ui/loading";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientLayoutProps {
  children: ReactNode;
}

const SmallLoading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { userName, isLoading, isAuthChecked, handleLogout } = useClientAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Vérification supplémentaire de la session et du type d'utilisateur
    const checkClientSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          console.log("Pas de session active dans ClientLayout");
          toast.error("Session expirée. Veuillez vous reconnecter.");
          navigate('/auth');
          return;
        }
        
        // Vérifier le type d'utilisateur pour s'assurer que c'est bien un client
        const userEmail = data.session.user.email;
        const userMetadata = data.session.user.user_metadata;
        
        // Vérifier d'abord le metadata (plus fiable)
        if (userMetadata?.user_type === 'admin') {
          toast.error("Cette section est réservée aux clients.");
          navigate('/admin');
          return;
        }
        
        // Vérifier si c'est un email administrateur conventionnel
        if (userEmail === "leviwebert147@gmail.com" || userEmail?.includes("admin")) {
          toast.error("Cette section est réservée aux clients.");
          navigate('/admin');
          return;
        }
        
        // Vérifier dans la base de données si l'utilisateur est un admin
        const { data: adminData } = await supabase
          .from('utilisateurs')
          .select('role')
          .eq('email', userEmail)
          .eq('role', 'admin')
          .maybeSingle();
          
        if (adminData) {
          toast.error("Cette section est réservée aux clients.");
          navigate('/admin');
          return;
        }
        
        // Vérifier si l'utilisateur est bien dans la table des clients
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (!clientData || clientError) {
          toast.error("Votre compte n'est pas associé à un profil client.");
          navigate('/auth');
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des droits client:", error);
        toast.error("Erreur de vérification des droits d'accès");
        navigate('/auth');
      }
    };
    
    if (isAuthChecked) {
      checkClientSession();
    }
  }, [isAuthChecked, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Afficher le chargement seulement pendant la vérification initiale de l'authentification
  if (isLoading && !isAuthChecked) {
    return <SmallLoading />;
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
