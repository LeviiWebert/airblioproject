
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
  const [error, setError] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isMounted && isLoading) {
        setIsLoading(false);
        setError("Le chargement a pris trop de temps. Veuillez rafraîchir la page ou contacter le support.");
        toast.error("Délai de chargement dépassé. Veuillez réessayer.");
      }
    }, 15000); // 15 seconds timeout
    
    setLoadTimeout(timeout);
    
    return () => {
      isMounted = false;
      if (loadTimeout) clearTimeout(loadTimeout);
      clearTimeout(timeout);
    };
  }, [isLoading]);
    
  useEffect(() => {
    let isMounted = true;
    
    const loadClientData = async () => {
      if (!session?.user) {
        console.log("Pas de session active dans ClientLayout");
        if (isMounted) {
          setError("Vous devez être connecté pour accéder à cette page");
          setIsLoading(false);
          toast.error("Veuillez vous connecter pour accéder à l'espace client");
          navigate('/auth');
        }
        return;
      }
      
      if (userType !== "client") {
        console.log("L'utilisateur n'est pas un client. Type:", userType);
        if (isMounted) {
          setError("Vous n'avez pas les permissions nécessaires pour accéder à cette page");
          setIsLoading(false);
          toast.error("Cette section est réservée aux clients.");
          navigate('/auth');
        }
        return;
      }
      
      if (!clientId) {
        console.log("Impossible de trouver l'ID client dans la base de données");
        if (isMounted) {
          setError("Votre profil client n'est pas correctement configuré");
          setIsLoading(false);
          toast.error("Votre profil client n'est pas correctement configuré");
          navigate('/auth');
        }
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
          setError(null);
        } else if (isMounted) {
          console.log("Aucune donnée client trouvée pour l'ID:", clientId);
          setUserName(user?.email?.split('@')[0] || "Client");
        }
      } catch (error: any) {
        console.error("Error fetching client data:", error);
        if (isMounted) {
          setUserName(user?.email?.split('@')[0] || "Client");
          // Nous ne définissons plus d'erreur ici pour éviter d'afficher un message d'erreur
          // setError("Erreur lors de la récupération de vos données");
          toast.error("Impossible de charger vos informations complètes. Fonctionnalités limitées disponibles.");
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
        if (isMounted) {
          setIsLoading(false);
          navigate('/auth');
        }
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
    try {
      await signOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion. Veuillez réessayer.");
    }
  };

  // Afficher le chargement seulement pendant la vérification initiale de l'authentification
  if (loading || (isLoading && !initialized)) {
    return <SmallLoading />;
  }

  // Afficher un message d'erreur si nécessaire
  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <div className="flex justify-between">
            <button 
              onClick={() => navigate('/auth')}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Se connecter
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      </div>
    );
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
