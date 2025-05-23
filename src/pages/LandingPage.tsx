import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, Anchor, Shield, Clock, User, Ship, Wrench, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { isAdminUser } from "@/utils/authUtils";

const LandingPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const checkUserType = async (userId: string) => {
      try {
        // First priority: check metadata (fastest method)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        // Check user metadata first
        const userMetadata = user.user_metadata;
        if (userMetadata?.user_type === 'admin') {
          return "admin";
        }
        
        if (userMetadata?.user_type === 'client') {
          return "client";
        }
        
        // Only if no metadata, check database
        const userEmail = user.email;
        
        // Vérifier d'abord si l'utilisateur est un admin
        const { data: adminData } = await supabase
          .from('utilisateurs')
          .select('role')
          .eq('id', userId)
          .eq('role', 'admin')
          .single();

        if (adminData) {
          return "admin";
        }

        // Si ce n'est pas un admin, vérifier s'il est un client
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('id', userId)
          .single();

        if (clientData) {
          return "client";
        }

        return null;
      } catch (error) {
        console.error("Erreur lors de la vérification du type d'utilisateur:", error);
        return null;
      }
    };
    
    // Get existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      
      if (session?.user?.id) {
        const userEmail = session.user.email;
        const userMetadata = session.user.user_metadata;
        
        // Check user_type in metadata (fastest method)
        if (userMetadata?.user_type === 'client') {
          setUserType("client");
          return;
        }
        
        // Si c'est un admin, on redirige tout de suite sans attendre la vérification dans la BD
        if (userMetadata?.user_type === 'admin' || isAdminUser(userEmail, userMetadata)) {
          setUserType("admin");
          return;
        }
        
        const type = await checkUserType(session.user.id);
        setUserType(type);
      } else {
        setUserType(null);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      
      if (session?.user?.id) {
        const userEmail = session.user.email;
        const userMetadata = session.user.user_metadata;
        
        // Check user_type in metadata (fastest method)
        if (userMetadata?.user_type === 'client') {
          setUserType("client");
          return;
        }
        
        // Si c'est un admin, on redirige tout de suite sans attendre la vérification dans la BD
        if (userMetadata?.user_type === 'admin' || isAdminUser(userEmail, userMetadata)) {
          setUserType("admin");
          return;
        }
        
        const type = await checkUserType(session.user.id);
        setUserType(type);
      } else {
        setUserType(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Si l'utilisateur est connecté en tant qu'admin, le rediriger immédiatement vers le dashboard
  if (session && userType === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleLoginClick = () => {
    if (session) {
      // Si déjà connecté, rediriger vers le tableau de bord approprié
      if (userType === "admin") {
        navigate("/admin", { replace: true });
      } else if (userType === "client") {
        navigate("/client-dashboard", { replace: true });
      } else {
        // If user type is unknown but session exists
        navigate("/index", { replace: true });
      }
    } else {
      navigate("/auth", { replace: true });
    }
  };
  
  const handleInterventionRequest = () => {
    // Si connecté en tant que client, rediriger vers la demande d'intervention
    if (session && userType === "client") {
      navigate("/intervention/request", { replace: true });
    } else {
      // Sinon rediriger vers l'authentification avec retour à la page de demande
      navigate("/auth", { state: { returnTo: "/intervention/request" }, replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">Airblio</h1>
              <span className="ml-2 text-sm font-medium text-muted-foreground">Solutions sous-marines</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              {/* Only show these links for authenticated clients */}
              {session && userType === "client" && (
                <>
                  <Link to="/client/requests" className="text-sm font-medium text-gray-700 hover:text-primary">
                    Demandes d'intervention
                  </Link>
                  <Link to="/client/profile" className="text-sm font-medium text-gray-700 hover:text-primary">
                    Mon compte
                  </Link>
                  <Link to="/client/interventions" className="text-sm font-medium text-gray-700 hover:text-primary">
                    Historique
                  </Link>
                </>
              )}
            </nav>
            <div>
              <Button variant="default" size="sm" onClick={handleLoginClick}>
                {session ? 'Accéder au tableau de bord' : 'Se connecter'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Solutions d'interventions sous-marines professionnelles
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                Services d'installation, maintenance et assistance pour vos infrastructures sous-marines.
                Notre équipe d'experts répond à vos besoins avec précision et sécurité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gap-2" onClick={handleInterventionRequest}>
                  Demander une intervention
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link to="/contact">
                  <Button variant="outline" size="lg">
                    Nous contacter
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-100 rounded-lg overflow-hidden h-48">
                  <div className="w-full h-full relative bg-gradient-to-br from-blue-400 to-blue-700">
                    <img 
                      src="/images/underwater-equipment-1.jpg" 
                      alt="Équipement sous-marin professionnel"
                      className="object-cover w-full h-full opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                      <div className="text-white text-center p-4">
                        <Ship className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Équipements professionnels</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-100 rounded-lg overflow-hidden h-48">
                  <div className="w-full h-full relative bg-gradient-to-br from-blue-400 to-blue-700">
                    <img 
                      src="/images/underwater-equipment-2.jpg" 
                      alt="Matériel d'intervention sous-marine"
                      className="object-cover w-full h-full opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                      <div className="text-white text-center p-4">
                        <Anchor className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Matériel spécialisé</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-100 rounded-lg overflow-hidden h-48">
                  <div className="w-full h-full relative bg-gradient-to-br from-blue-400 to-blue-700">
                    <img 
                      src="/images/underwater-equipment-3.png" 
                      alt="Outils techniques sous-marins"
                      className="object-cover w-full h-full opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                      <div className="text-white text-center p-4">
                        <Wrench className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Outils techniques</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-100 rounded-lg overflow-hidden h-48">
                  <div className="w-full h-full relative bg-gradient-to-br from-blue-400 to-blue-700">
                    <img 
                      src="/images/underwater-equipment-4.jpg" 
                      alt="Équipement d'intervention sous-marine"
                      className="object-cover w-full h-full opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                      <div className="text-white text-center p-4">
                        <Waves className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Intervention sous-marine</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nos Services d'Intervention</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Anchor className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Installation</h3>
              <p className="text-gray-600">
                Mise en place d'équipements sous-marins, câblage, structures et systèmes de fixation pour tous types d'infrastructures.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Maintenance</h3>
              <p className="text-gray-600">
                Entretien régulier, inspection, réparation et maintenance préventive des installations sous-marines existantes.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Assistance</h3>
              <p className="text-gray-600">
                Support technique, intervention d'urgence et conseil pour tous vos besoins en milieu sous-marin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="bg-gray-200 rounded-lg overflow-hidden h-80">
                {/* Team image placeholder */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-800 text-white">
                  <div className="text-center p-6">
                    <img 
                      src="/images/underwater-equipment-4.jpg" 
                      alt="Équipement d'intervention sous-marine"
                      className="object-cover w-full h-full opacity-80"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-8">
              <h2 className="text-3xl font-bold mb-6">Notre Expertise</h2>
              <p className="text-gray-600 mb-6">
                Avec plus de 15 ans d'expérience dans le secteur des interventions sous-marines, 
                notre équipe de professionnels certifiés met son savoir-faire au service de vos projets.
              </p>
              <p className="text-gray-600 mb-6">
                Nous intervenons dans des conditions variées, à différentes profondeurs et sur tous types 
                d'infrastructures, avec une attention particulière portée à la sécurité et à la qualité du travail.
              </p>
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">150+</div>
                  <div className="text-sm text-gray-500">Projets réalisés</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">25</div>
                  <div className="text-sm text-gray-500">Experts certifiés</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <div className="text-sm text-gray-500">Satisfaction client</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Airblio</h3>
              <p className="text-gray-400">
                Solutions professionnelles d'intervention sous-marine pour tous vos projets industriels et maritimes.
              </p>
            </div>
            <div>
              <h4 className="text-md font-bold mb-4">Liens utiles</h4>
              <ul className="space-y-2">
                {/* Only show client-specific links when logged in as client */}
                {session && userType === "client" ? (
                  <>
                    <li><Link to="/client/requests" className="text-gray-400 hover:text-white">Demandes d'intervention</Link></li>
                    <li><Link to="/client/interventions" className="text-gray-400 hover:text-white">Historique</Link></li>
                  </>
                ) : (
                  <li><Link to="/auth" className="text-gray-400 hover:text-white">Accéder à votre espace</Link></li>
                )}
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Nous contacter</Link></li>
                <li><Link to="/intervention/request" className="text-gray-400 hover:text-white">Demander une intervention</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-bold mb-4">Informations légales</h4>
              <ul className="space-y-2">
                <li><Link to="/legal" className="text-gray-400 hover:text-white">Mentions légales</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Politique de confidentialité</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white">Conditions d'utilisation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-bold mb-4">Contact</h4>
              <address className="text-gray-400 not-italic">
                <div className="mb-2">123 Avenue de la Mer</div>
                <div className="mb-2">13000 Marseille, France</div>
                <div className="mb-2">contact@Airblio.com</div>
                <div>+33 4 91 XX XX XX</div>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Airblio. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
