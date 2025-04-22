import { Link } from "react-router-dom";
import { Home, FileText, Clock, User, FileCheck } from "lucide-react";

interface ClientSidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const ClientSidebar = ({ sidebarOpen, toggleSidebar }: ClientSidebarProps) => {
  return (
    <>
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
            <li>
              <Link
                to="/client/pvs"
                className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md group transition-colors"
              >
                <FileCheck className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                <span>Mes Procès-Verbaux</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};
