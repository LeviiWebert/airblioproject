import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SmallLoading } from "@/components/ui/loading";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const detailsSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  phone: z.string().min(8, { message: "Veuillez entrer un numéro de téléphone valide." }),
  address: z.string().min(5, { message: "Veuillez entrer une adresse valide." }),
  city: z.string().min(2, { message: "Veuillez entrer une ville valide." }),
  postalCode: z.string().min(5, { message: "Veuillez entrer un code postal valide." }),
});

type DetailsValues = z.infer<typeof detailsSchema>;

const InterventionDetails = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step1Data, setStep1Data] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { session, userType, clientId } = useAuth();

  const form = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (session && userType === 'client' && clientId) {
          toast("Vous êtes déjà connecté en tant que client. Redirection vers votre tableau de bord.");
          navigate("/client-dashboard");
          return;
        }
        
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          navigate("/auth", { state: { returnTo: "/intervention/request" } });
          return;
        }
        
        if (data.session.user?.email) {
          form.setValue("email", data.session.user.email);
        }
        
        const storedData = sessionStorage.getItem("interventionStep1");
        if (storedData) {
          setStep1Data(JSON.parse(storedData));
        } else {
          navigate("/intervention/request");
          return;
        }
        
        setAuthChecked(true);
      } catch (error) {
        console.error("Erreur de vérification de l'authentification:", error);
        toast("Erreur lors de la vérification de votre session");
        navigate("/auth");
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sessionData) => {
        if (!sessionData) {
          navigate("/auth", { state: { returnTo: "/intervention/request" } });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, form, session, userType, clientId]);

  const onSubmit = (data: DetailsValues) => {
    setIsLoading(true);
    
    const combinedData = {
      ...step1Data,
      contactDetails: data
    };
    
    sessionStorage.setItem("interventionData", JSON.stringify(combinedData));
    
    navigate("/intervention/schedule");
    setIsLoading(false);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <SmallLoading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary">GestInt</Link>
              <span className="ml-2 text-sm font-medium text-muted-foreground">Sous-Marine</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/client-dashboard" className="text-sm font-medium text-primary hover:underline">
                Tableau de bord
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">Demande d'intervention</h1>
              <p className="text-gray-600">Étape 2 sur 3: Coordonnées et adresse d'intervention</p>
              
              <div className="w-full mt-6 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-1/3 bg-primary h-2 rounded-l-full"></div>
                  <div className="w-1/3 bg-primary h-2"></div>
                  <div className="w-1/3 bg-gray-200 h-2 rounded-r-full"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-medium text-primary">Description</span>
                  <span className="font-medium text-primary">Détails</span>
                  <span>Confirmation</span>
                </div>
              </div>
            </div>
            
            <Card className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Vos coordonnées</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="votre@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+33 ..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-gray-200">
                    <h2 className="text-xl font-semibold">Adresse d'intervention</h2>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Input placeholder="Rue et numéro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                              <Input placeholder="Ville" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code postal</FormLabel>
                            <FormControl>
                              <Input placeholder="Code postal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/intervention/request")}
                    >
                      Retour
                    </Button>
                    <Button 
                      type="submit" 
                      className="min-w-[150px]"
                      disabled={isLoading}
                    >
                      {isLoading ? "Chargement..." : "Continuer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 text-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} GestInt Sous-Marine. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InterventionDetails;
