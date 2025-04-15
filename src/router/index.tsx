
import { createBrowserRouter, RouteObject } from "react-router-dom";
import adminRoutes from "./adminRoutes";
import { clientRoutes } from "./clientRoutes";
import { publicRoutes } from "./publicRoutes";
import { authRoutes } from "./authRoutes";
import NotFound from "@/pages/NotFound";

// Convert route elements to RouteObject type correctly
const routeObjects: RouteObject[] = [
  ...publicRoutes as RouteObject[],
  ...authRoutes as RouteObject[],
  adminRoutes as RouteObject,
  ...clientRoutes as RouteObject[],
  {
    path: "*",
    element: <NotFound />
  }
];

export const router = createBrowserRouter(routeObjects);
