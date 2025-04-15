
import { createBrowserRouter, RouteObject } from "react-router-dom";
import adminRoutes from "./adminRoutes";
import { clientRoutes } from "./clientRoutes";
import { publicRoutes } from "./publicRoutes";
import { authRoutes } from "./authRoutes";
import NotFound from "@/pages/NotFound";

// Convert route elements to RouteObject type
const routeObjects: RouteObject[] = [
  ...publicRoutes,
  ...authRoutes,
  adminRoutes,
  ...clientRoutes,
  {
    path: "*",
    element: <NotFound />
  }
];

export const router = createBrowserRouter(routeObjects);
