
import { createBrowserRouter } from "react-router-dom";
import { adminRoutes } from "./adminRoutes";
import { clientRoutes } from "./clientRoutes";
import { publicRoutes } from "./publicRoutes";
import { authRoutes } from "./authRoutes";
import NotFound from "@/pages/NotFound";

// Combine all routes into a single router configuration
export const router = createBrowserRouter([
  ...publicRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...clientRoutes,
  // Add a catch-all route for any undefined routes
  {
    path: "*",
    element: <NotFound />
  }
]);
