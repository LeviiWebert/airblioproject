
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { clientService, equipeService } from "@/services/dataService";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

const formSchema = z.object({
  clientId: z.string().min(1, { message: "Veuillez sélectionner un client" }),
  localisation: z.string().min(3, { message: "L'adresse doit contenir au moins 3 caractères" }),
  description: z.string().min(10, { message: "La description doit contenir au moins 10 caractères" }),
  urgence: z.enum(["basse", "moyenne", "haute", "critique"], {
    required_error: "Veuillez sélectionner un niveau d'urgence",
  }),
  dateDebut: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
  equipeId: z.string().min(1, { message: "Veuillez sélectionner une équipe" }),
});

const NewInterventionPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);

  // Charger les clients et équipes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, equipesData] = await Promise.all([
          clientService.getAll(),
          equipeService.getAll()
        ]);
        console.log("Clients chargés:", clientsData);
        setClients(clientsData);
        setEquipes(equipesData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les données nécessaires.",
        });
      }
    };
    fetchData();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      localisation: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      console.log("Valeurs du formulaire:", values);
      
      // Créer d'abord une demande d'intervention
      const { data: demandeData, error: demandeError } = await supabase
        .from('demande_interventions')
        .insert([
          {
            client_id: values.clientId,
            description: values.description,
            urgence: values.urgence,
            statut: 'validée'
          }
        ])
        .select()
        .single();
      
      if (demandeError) throw demandeError;
      
      // Ensuite créer l'intervention
      const { data: interventionData, error: interventionError } = await supabase
        .from('interventions')
        .insert([
          {
            demande_intervention_id: demandeData.id,
            date_debut: values.dateDebut.toISOString(),
            localisation: values.localisation,
            statut: 'planifiée',
            rapport: ''
          }
        ])
        .select()
        .single();
      
      if (interventionError) throw interventionError;
      
      // Mettre à jour la demande avec l'ID de l'intervention
      const { error: updateDemandeError } = await supabase
        .from('demande_interventions')
        .update({ intervention_id: interventionData.id })
        .eq('id', demandeData.id);
      
      if (updateDemandeError) throw updateDemandeError;
      
      // Créer l'association avec l'équipe
      const { error: equipeError } = await supabase
        .from('intervention_equipes')
        .insert([
          {
            intervention_id: interventionData.id,
            equipe_id: values.equipeId
          }
        ]);
      
      if (equipeError) throw equipeError;
      
      sonnerToast.success("Intervention créée avec succès");
      
      toast({
        title: "Intervention créée",
        description: "L'intervention a été créée avec succès.",
      });
      navigate("/admin/interventions");
    } catch (error: any) {
      console.error("Erreur lors de la création de l'intervention:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de créer l'intervention: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Créer une nouvelle intervention</h1>
        <p className="text-muted-foreground">
          Remplissez le formulaire ci-dessous pour créer une nouvelle intervention.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nom_entreprise}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une équipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipes.map((equipe) => (
                        <SelectItem key={equipe.id} value={equipe.id}>
                          {equipe.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="localisation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse d'intervention</FormLabel>
                  <FormControl>
                    <Input placeholder="123 rue de la Mer, 13000 Marseille" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau d'urgence</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un niveau d'urgence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basse">Basse</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="critique">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateDebut"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date d'intervention</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
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
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description de l'intervention</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Décrivez les détails de l'intervention..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/interventions")}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création en cours..." : "Créer l'intervention"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewInterventionPage;
