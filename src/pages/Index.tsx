
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirection automatique vers la page d'accueil
    navigate("/");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Redirection en cours...</h1>
        <p className="text-xl text-gray-600">Veuillez patienter ou <a href="/" className="text-blue-600 hover:underline">cliquez ici</a> si vous n'êtes pas redirigé automatiquement.</p>
      </div>
    </div>
  );
};

export default Index;
