import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useInterventionStep1 } from "@/hooks/useInterventionStep1";

const requestSchema = z.object({
  description: z.string()
    .min(20, { message: "La description doit contenir au moins 20 caractères." })
    .max(1000, { message: "La description ne doit pas dépasser 1000 caractères." }),
  type: z.enum(["standard", "profondeur", "assistance"], {
    required_error: "Veuillez sélectionner un type d'intervention.",
  }),
  urgence: z.enum(["basse", "moyenne", "haute", "critique"], {
    required_error: "Veuillez indiquer le niveau d'urgence.",
  }),
  localisation: z.string()
    .min(5, { message: "Veuillez indiquer le lieu de l'intervention." })
    .max(255, { message: "Le lieu ne doit pas dépasser 255 caractères." }),
});

type RequestValues = z.infer<typeof requestSchema>;

const RequestIntervention = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { session, userType, clientId } = useAuth();
  const { saveStep1, getStep1 } = useInterventionStep1();

  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      description: "",
      type: "standard",
      urgence: "moyenne",
      localisation: "",
    },
  });

  useEffect(() => {
    const loaded = getStep1();
    if (loaded) {
      form.reset(loaded);
    }
  }, [form, getStep1]);

  const onSubmit = async (data: RequestValues) => {
    setIsLoading(true);
    try {
      saveStep1(data);
      if (session && userType === 'client' && clientId) {
        navigate("/intervention/details");
      } else {
        navigate("/auth", { state: { returnTo: "/intervention/details" } });
      }
    } catch {
      toast("Erreur lors de l'enregistrement des données");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary">GestInt</Link>
              <span className="ml-2 text-sm font-medium text-muted-foreground">Sous-Marine</span>
            </div>
            {session ? (
              <Link to="/client-dashboard" className="text-sm font-medium text-primary hover:underline">
                Tableau de bord
              </Link>
            ) : (
              <Link to="/auth" className="text-sm font-medium text-primary hover:underline">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex-grow bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">Demande d'intervention</h1>
              <p className="text-gray-600">Étape 1 sur 3: Décrivez votre besoin d'intervention</p>
              
              <div className="w-full mt-6 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-1/3 bg-primary h-2 rounded-l-full"></div>
                  <div className="w-1/3 bg-gray-200 h-2"></div>
                  <div className="w-1/3 bg-gray-200 h-2 rounded-r-full"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-medium text-primary">Description</span>
                  <span>Détails</span>
                  <span>Confirmation</span>
                </div>
              </div>
            </div>
            
            <Card className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-medium">Description de votre besoin</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Décrivez précisément votre besoin d'intervention sous-marine..." 
                            className="min-h-[150px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="localisation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-medium">Lieu d'intervention</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Adresse ou site de l'intervention" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-lg font-medium">Type d'intervention</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                          >
                            <FormItem>
                              <FormLabel className="cursor-pointer [&:has([data-state=checked])>div]:border-primary">
                                <FormControl>
                                  <RadioGroupItem value="standard" className="sr-only" />
                                </FormControl>
                                <div className="border rounded-lg p-4 hover:border-primary transition-all">
                                  <h3 className="font-medium">Standard</h3>
                                  <p className="text-sm text-muted-foreground">Intervention classique à faible profondeur</p>
                                </div>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormLabel className="cursor-pointer [&:has([data-state=checked])>div]:border-primary">
                                <FormControl>
                                  <RadioGroupItem value="profondeur" className="sr-only" />
                                </FormControl>
                                <div className="border rounded-lg p-4 hover:border-primary transition-all">
                                  <h3 className="font-medium">Profondeur</h3>
                                  <p className="text-sm text-muted-foreground">Intervention spécialisée à grande profondeur</p>
                                </div>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormLabel className="cursor-pointer [&:has([data-state=checked])>div]:border-primary">
                                <FormControl>
                                  <RadioGroupItem value="assistance" className="sr-only" />
                                </FormControl>
                                <div className="border rounded-lg p-4 hover:border-primary transition-all">
                                  <h3 className="font-medium">Assistance 24/7</h3>
                                  <p className="text-sm text-muted-foreground">Support et intervention d'urgence</p>
                                </div>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="urgence"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-lg font-medium">Niveau d'urgence</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-3"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="basse" />
                                </FormControl>
                                <FormLabel className="font-normal">Basse</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="moyenne" />
                                </FormControl>
                                <FormLabel className="font-normal">Moyenne</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="haute" />
                                </FormControl>
                                <FormLabel className="font-normal">Haute</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="critique" />
                                </FormControl>
                                <FormLabel className="font-normal">Critique</FormLabel>
                              </FormItem>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end pt-4">
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
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Besoin d'assistance ? <Link to="/contact" className="text-primary hover:underline">Contactez-nous</Link>
              </p>
            </div>
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

export default RequestIntervention;
