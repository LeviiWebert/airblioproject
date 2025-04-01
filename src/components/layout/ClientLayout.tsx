
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

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
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
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

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
                      <span className="mr-1">Client</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem as={Link} to="/client/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem as={Link} to="/client/settings">
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
          className={`bg-sidebar fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 transform transition-transform duration-300 ease-in-out z-20 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="px-4 py-6">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/client-dashboard"
                  className="flex items-center px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md group transition-colors"
                >
                  <Home className="h-5 w-5 mr-3 text-sidebar-foreground" />
                  <span>Tableau de bord</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/client/requests"
                  className="flex items-center px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md group transition-colors"
                >
                  <FileText className="h-5 w-5 mr-3 text-sidebar-foreground" />
                  <span>Demandes d'intervention</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/client/interventions"
                  className="flex items-center px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md group transition-colors"
                >
                  <Clock className="h-5 w-5 mr-3 text-sidebar-foreground" />
                  <span>Interventions en cours</span>
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
