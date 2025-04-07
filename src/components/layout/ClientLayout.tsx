
import { ReactNode, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ClientHeader } from "./client/ClientHeader";
import { ClientSidebar } from "./client/ClientSidebar";
import { Loading } from "@/components/ui/loading";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
  const { session, user, userType, loading, initialized, signOut } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("Client");
  
  useEffect(() => {
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
      
      try {
        // Try to get client name from database
        const { data, error } = await fetch(`/api/client-name?userId=${user?.id}`).then(res => res.json());
        if (data && !error) {
          setUserName(data.nom_entreprise || "Client");
        } else {
          console.log("Utilisateur client confirmé, nom par défaut utilisé");
          setUserName(user?.email?.split('@')[0] || "Client");
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
        setUserName(user?.email?.split('@')[0] || "Client");
      }
    };
    
    if (initialized && !loading && session) {
      loadClientData();
    }
  }, [session, user, userType, loading, initialized, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Afficher le chargement seulement pendant la vérification initiale de l'authentification
  if (loading && !initialized) {
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
