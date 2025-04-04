
import { RouteObject } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import ClientDashboard from "@/pages/client/ClientDashboard";
import ClientProfile from "@/pages/client/ClientProfile";
import ClientInterventionsList from "@/pages/client/InterventionsList";
import ClientInterventionDetails from "@/pages/client/InterventionDetails";
import InterventionRecap from "@/pages/client/InterventionRecap";
import { ProtectedClientRoute } from "@/components/auth/ProtectedClientRoute";

export const clientRoutes: RouteObject[] = [
  {
    path: "/client-dashboard",
    element: (
      <ProtectedClientRoute>
        <ClientLayout>
          <ClientDashboard />
        </ClientLayout>
      </ProtectedClientRoute>
    ),
  },
  {
    path: "/client/profile",
    element: (
      <ProtectedClientRoute>
        <ClientLayout>
          <ClientProfile />
        </ClientLayout>
      </ProtectedClientRoute>
    ),
  },
  {
    path: "/client/interventions",
    element: (
      <ProtectedClientRoute>
        <ClientLayout>
          <ClientInterventionsList />
        </ClientLayout>
      </ProtectedClientRoute>
    ),
  },
  {
    path: "/client/intervention/:id",
    element: (
      <ProtectedClientRoute>
        <ClientLayout>
          <ClientInterventionDetails />
        </ClientLayout>
      </ProtectedClientRoute>
    ),
  },
  {
    path: "/client/intervention/recap/:id",
    element: (
      <ProtectedClientRoute>
        <ClientLayout>
          <InterventionRecap />
        </ClientLayout>
      </ProtectedClientRoute>
    ),
  },
];
