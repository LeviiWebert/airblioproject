
import { ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ClientHeader } from "./client/ClientHeader";
import { ClientSidebar } from "./client/ClientSidebar";
import { Loading } from "@/components/ui/loading";
import { useClientAuth } from "@/hooks/useClientAuth";

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { userName, isLoading, handleLogout } = useClientAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return <Loading />;
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
