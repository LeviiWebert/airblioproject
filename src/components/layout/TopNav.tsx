
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopNavProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const TopNav = ({ toggleSidebar, sidebarOpen }: TopNavProps) => {
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
          <div className="ml-4 mr-8">
            <h1 className="text-lg font-semibold">GestInt - Sous-Marine</h1>
          </div>
          
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
          
          <div className="hidden sm:flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              AD
            </div>
            <div className="ml-2 mr-1">
              <p className="text-sm font-medium">Admin</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
};
