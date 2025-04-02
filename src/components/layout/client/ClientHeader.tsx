
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, Bell, Settings, Search } from "lucide-react";

interface ClientHeaderProps {
  userName: string;
  toggleSidebar: () => void;
  handleLogout: () => void;
  sidebarOpen: boolean;
}

export const ClientHeader = ({ 
  userName, 
  toggleSidebar, 
  handleLogout,
  sidebarOpen
}: ClientHeaderProps) => {
  return (
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
                <DropdownMenuItem asChild>
                  <Link to="/client/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/client/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </Link>
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
  );
};
