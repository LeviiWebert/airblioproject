
import { RouteObject } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";

export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
