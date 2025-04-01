
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Check, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

const scheduleSchema = z.object({
  date: z.date({
    required_error: "Veuillez sélectionner une date.",
  }),
  timeSlot: z.string({
    required_error: "Veuillez sélectionner un créneau horaire.",
  }),
});

type ScheduleValues = z.infer<typeof scheduleSchema>;

const InterventionSchedule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [combinedData, setCombinedData] = useState<any>(null);

  const form = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      timeSlot: "",
    },
  });

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { state: { returnTo: "/intervention/request" } });
      } else {
        setSession(session);
        
        // Récupérer les données des étapes précédentes
        const storedData = sessionStorage.getItem("interventionData");
        if (storedData) {
          setCombinedData(JSON.parse(storedData));
        } else {
          navigate("/intervention/request");
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth", { state: { returnTo: "/intervention/request" } });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (data: ScheduleValues) => {
    setIsSubmitting(true);
    
    try {
      // Préparer toutes les données pour la soumission
      const finalData = {
        ...combinedData,
        schedule: {
          date: format(data.date, "yyyy-MM-dd"),
          timeSlot: data.timeSlot
        },
      };
      
      console.log("Données complètes de la demande:", finalData);
      
      if (!session?.user?.id) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Créer la demande d'intervention dans la base de données
      const { data: insertedData, error } = await supabase
        .from('demande_interventions')
        .insert([
          {
            client_id: session.user.id,
            description: finalData.description, 
            urgence: finalData.urgence,
            statut: "en_cours_analyse",
            date_demande: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      console.log("Demande créée avec succès:", insertedData);
      
      // Nettoyer les données stockées
      sessionStorage.removeItem("interventionStep1");
      sessionStorage.removeItem("interventionData");
      
      toast({
        title: "Demande envoyée",
        description: "Votre demande d'intervention a été enregistrée avec succès.",
      });
      
      // Rediriger vers le tableau de bord
      navigate("/client-dashboard");
      
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la soumission de votre demande.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour désactiver les dates passées et les weekends
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || isWeekend(date);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
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
              <p className="text-gray-600">Étape 3 sur 3: Planification et confirmation</p>
              
              <div className="w-full mt-6 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-1/3 bg-primary h-2 rounded-l-full"></div>
                  <div className="w-1/3 bg-primary h-2"></div>
                  <div className="w-1/3 bg-primary h-2 rounded-r-full"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-medium text-primary">Description</span>
                  <span className="font-medium text-primary">Détails</span>
                  <span className="font-medium text-primary">Confirmation</span>
                </div>
              </div>
            </div>
            
            <Card className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Choisissez une date et un créneau horaire</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date souhaitée</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "d MMMM yyyy", { locale: fr })
                                    ) : (
                                      <span>Sélectionnez une date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={disabledDays}
                                  initialFocus
                                  fromDate={new Date()}
                                  toDate={addDays(new Date(), 90)}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="timeSlot"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Créneau horaire</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un créneau horaire" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Résumé de votre demande</h2>
                    
                    {combinedData && (
                      <div className="space-y-4 bg-slate-50 p-4 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-medium text-gray-700">Type d'intervention</h3>
                            <p>{combinedData.type === 'standard' ? 'Standard' : 
                               combinedData.type === 'profondeur' ? 'Profondeur' : 
                               'Assistance 24/7'}</p>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-700">Niveau d'urgence</h3>
                            <p className="capitalize">{combinedData.urgence}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-700">Description</h3>
                          <p className="text-sm">{combinedData.description}</p>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-700">Lieu d'intervention</h3>
                          <p>{combinedData.localisation}</p>
                        </div>
                        
                        {combinedData.contactDetails && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-medium text-gray-700">Contact</h3>
                              <p>{combinedData.contactDetails.email}<br />
                              {combinedData.contactDetails.phone}</p>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-700">Adresse</h3>
                              <p>
                                {combinedData.contactDetails.address}<br />
                                {combinedData.contactDetails.postalCode} {combinedData.contactDetails.city}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/intervention/details")}
                    >
                      Retour
                    </Button>
                    <Button 
                      type="submit" 
                      className="min-w-[200px]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2">
                            <Clock className="h-4 w-4" />
                          </span>
                          Traitement...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Check className="mr-2 h-4 w-4" /> 
                          Confirmer la demande
                        </span>
                      )}
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

      {/* Footer */}
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

export default InterventionSchedule;
