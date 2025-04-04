
import { createBrowserRouter } from "react-router-dom";
import { adminRoutes } from "./adminRoutes";
import { clientRoutes } from "./clientRoutes";
import { publicRoutes } from "./publicRoutes";
import { authRoutes } from "./authRoutes";

// Combine all routes into a single router configuration
export const router = createBrowserRouter([
  ...publicRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...clientRoutes,
]);
