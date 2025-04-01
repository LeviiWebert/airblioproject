
import React from "react";
import { Navigate } from "react-router-dom";

const Index = () => {
  // Utiliser Navigate au lieu de useNavigate pour une redirection simple
  return <Navigate to="/" replace />;
};

export default Index;
