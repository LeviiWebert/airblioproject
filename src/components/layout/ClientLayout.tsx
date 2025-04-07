
import { ReactNode, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ClientHeader } from "./client/ClientHeader";
import { ClientSidebar } from "./client/ClientSidebar";
import { Loading } from "@/components/ui/loading";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const { session, user, userType, loading, initialized, clientId, signOut } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("Client");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadClientData = async () => {
      if (!session?.user) {
        console.log("Pas de session active dans ClientLayout");
        toast.error("Veuillez vous connecter pour accéder à l'espace client");
        navigate('/auth');
        return;
      }
      
      if (userType !== "client") {
        console.log("L'utilisateur n'est pas un client. Type:", userType);
        toast.error("Cette section est réservée aux clients.");
        navigate('/auth');
        return;
      }
      
      if (!clientId) {
        console.log("Impossible de trouver l'ID client dans la base de données");
        toast.error("Votre profil client n'est pas correctement configuré");
        navigate('/auth');
        return;
      }
      
      try {
        // Récupérer les données du client directement depuis Supabase
        const { data, error } = await supabase
          .from('clients')
          .select('nom_entreprise')
          .eq('id', clientId)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data && isMounted) {
          setUserName(data.nom_entreprise || "Client");
        } else if (isMounted) {
          console.log("Aucune donnée client trouvée pour l'ID:", clientId);
          setUserName(user?.email?.split('@')[0] || "Client");
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
        if (isMounted) {
          setUserName(user?.email?.split('@')[0] || "Client");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    if (initialized && !loading) {
      if (session) {
        loadClientData();
      } else {
        setIsLoading(false);
        navigate('/auth');
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [session, user, userType, loading, initialized, navigate, clientId]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Afficher le chargement seulement pendant la vérification initiale de l'authentification
  if (loading || (isLoading && !initialized)) {
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
