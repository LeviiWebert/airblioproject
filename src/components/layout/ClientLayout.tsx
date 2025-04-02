
import { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Menu, 
  User, 
  LogOut, 
  Bell, 
  FileText, 
  Clock, 
  Settings,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté et est bien un client
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          console.log("Aucune session trouvée. Redirection vers /auth");
          navigate('/auth');
          return;
        }
        
        const userId = data.session.user.id;
        
        // Vérifier si l'utilisateur existe dans la table clients
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', userId);
        
        if (clientError) {
          console.error("Erreur lors de la vérification du client:", clientError);
          throw new Error(clientError.message);
        }
        
        // Si l'utilisateur n'est pas trouvé dans la table clients, le rediriger
        if (!clientData || clientData.length === 0) {
          console.log("L'utilisateur n'est pas un client. Redirection vers /auth");
          toast.error("Vous devez être connecté en tant que client pour accéder à cette page");
          await supabase.auth.signOut();
          navigate('/auth');
          return;
        }
        
        // Récupérer le nom de l'utilisateur si disponible
        setUserName(clientData[0]?.nom_entreprise || data.session.user.email || "Client");
        
        console.log("Client authentifié avec succès:", clientData[0]);
      } catch (error: any) {
        console.error("Erreur d'authentification:", error);
        toast.error("Erreur d'authentification: " + (error.message || "Connexion impossible"));
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-30">
        <div className="flex items-center justify-between px-4 py-3 h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/client-dashboard" className="ml-4 mr-8">
              <h1 className="text-lg font-semibold">GestInt - Client</h1>
            </Link>
            
            <div className="hidden md:flex items-center relative max-w-md">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-10 w-72 bg-gray-50 dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
            </div>
            
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">{userName}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/client/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/client/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 transform transition-transform duration-300 ease-in-out z-20 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="px-4 py-6">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/client-dashboard"
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md group transition-colors"
                >
                  <Home className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Tableau de bord</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/intervention/request"
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md group transition-colors"
                >
                  <FileText className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Demander une intervention</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/client/interventions"
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md group transition-colors"
                >
                  <Clock className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Mes interventions</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/client/profile"
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md group transition-colors"
                >
                  <User className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Mon profil</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        
        {/* Overlay pour fermer le sidebar sur mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={toggleSidebar}
          />
        )}
        
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
