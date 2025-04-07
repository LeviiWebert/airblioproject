
import { RouteObject } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import ClientDashboard from "@/pages/client/ClientDashboard";
import ClientProfile from "@/pages/client/ClientProfile";
import ClientInterventionsList from "@/pages/client/InterventionsList";
import ClientInterventionDetails from "@/pages/client/InterventionDetails";
import InterventionRecap from "@/pages/client/InterventionRecap";
import { ProtectedClientRoute } from "@/components/auth/ProtectedClientRoute";
import ProcessVerbalClient from "@/pages/client/ProcessVerbalClient";

// Helper function to wrap client components with protection and layout
const withClientProtection = (Component: React.ComponentType<any>) => (
  <ProtectedClientRoute>
    <ClientLayout>
      <Component />
    </ClientLayout>
  </ProtectedClientRoute>
);

// Client routes configuration
export const clientRoutes: RouteObject[] = [
  {
    path: "/client-dashboard",
    element: withClientProtection(ClientDashboard)
  },
  {
    path: "/client/profile",
    element: withClientProtection(ClientProfile)
  },
  {
    path: "/client/interventions",
    element: withClientProtection(ClientInterventionsList)
  },
  {
    path: "/client/intervention/:id",
    element: withClientProtection(ClientInterventionDetails)
  },
  {
    path: "/client/intervention/recap/:id",
    element: withClientProtection(InterventionRecap)
  },
  {
    path: "/client/pv/:id",
    element: withClientProtection(ProcessVerbalClient)
  }
];
