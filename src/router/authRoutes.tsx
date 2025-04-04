
import { RouteObject, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import { useAuth } from "@/hooks/useAuth";
import InterventionDetails from "@/pages/intervention/InterventionDetails";
import InterventionSchedule from "@/pages/intervention/InterventionSchedule";
import RequestIntervention from "@/pages/intervention/RequestIntervention";

// Custom component to check if user is authenticated
const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/auth" replace />;
};

export const authRoutes: RouteObject[] = [
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/login",
    element: <Navigate to="/auth" replace />,
  },
  {
    path: "/index",
    element: <AuthCheck><Index /></AuthCheck>,
  },
  {
    path: "/intervention/request",
    element: <AuthCheck><RequestIntervention /></AuthCheck>,
  },
  {
    path: "/intervention/details",
    element: <AuthCheck><InterventionDetails /></AuthCheck>,
  },
  {
    path: "/intervention/schedule",
    element: <AuthCheck><InterventionSchedule /></AuthCheck>,
  },
  {
    path: "/dashboard",
    element: <Navigate to="/index" replace />,
  },
];
