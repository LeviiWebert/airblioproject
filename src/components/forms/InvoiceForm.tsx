
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getInterventionsForSelection, FacturationFormData } from "@/services/supabaseService/facturationService";
import { FacturationWithDetails } from "@/services/supabaseService/facturationService";

// Schéma de validation pour le formulaire de facturation
const invoiceDetailsSchema = z.object({
  description: z.string().min(1, { message: "La description est requise" }),
  heures_travaillees: z.number().min(0.5, { message: "Minimum 0.5 heure" }),
  taux_horaire: z.number().min(1, { message: "Le taux horaire minimum est de 1€" }),
});

const invoiceSchema = z.object({
  date_facturation: z.date(),
  intervention_id: z.string().min(1, { message: "L'intervention est requise" }),
  statut_paiement: z.enum(["en_attente", "payée", "annulée"], {
    required_error: "Le statut de paiement est requis",
  }),
  details: z.array(invoiceDetailsSchema).min(1, { message: "Au moins un détail de facturation est requis" }),
  montant_total: z.number().optional(),
});

interface InvoiceFormProps {
  onSubmit: (values: FacturationFormData) => void;
  initialData?: FacturationWithDetails;
  isSubmitting: boolean;
}

export default function InvoiceForm({ onSubmit, initialData, isSubmitting }: InvoiceFormProps) {
  const [interventions, setInterventions] = useState<Array<{ id: string; label: string }>>([]);

  // Préparation des valeurs initiales pour le formulaire
  const getDefaultValues = () => {
    if (initialData) {
      return {
        date_facturation: initialData.date_facturation ? new Date(initialData.date_facturation) : new Date(),
        intervention_id: initialData.intervention_id || "",
        statut_paiement: initialData.statut_paiement as "en_attente" | "payée" | "annulée" || "en_attente",
        details: initialData.details?.map(detail => ({
          description: detail.description,
          heures_travaillees: Number(detail.heures_travaillees),
          taux_horaire: Number(detail.taux_horaire),
        })) || [{
          description: "",
          heures_travaillees: 1,
          taux_horaire: 50,
        }],
        montant_total: Number(initialData.montant_total) || 0,
      };
    }

    return {
      date_facturation: new Date(),
      intervention_id: "",
      statut_paiement: "en_attente" as const,
      details: [{
        description: "",
        heures_travaillees: 1,
        taux_horaire: 50,
      }],
      montant_total: 0,
    };
  };

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: getDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "details",
  });

  // Chargement des interventions disponibles
  useEffect(() => {
    const loadInterventions = async () => {
      try {
        // Si on est en mode édition, on doit ajouter l'intervention actuelle à la liste
        if (initialData?.intervention_id) {
          const interventionsList = await getInterventionsForSelection();
          // Vérifier si l'intervention actuelle est dans la liste
          const hasCurrentIntervention = interventionsList.some(
            intervention => intervention.id === initialData.intervention_id
          );

          // Si non, ajouter l'intervention actuelle à la liste
          if (!hasCurrentIntervention && initialData.intervention) {
            interventionsList.push({
              id: initialData.intervention.id,
              label: `${initialData.client?.nom_entreprise || 'Client inconnu'} - ${initialData.intervention.localisation}`
            });
          }

          setInterventions(interventionsList);
        } else {
          const interventionsList = await getInterventionsForSelection();
          setInterventions(interventionsList);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des interventions:", error);
      }
    };

    loadInterventions();
  }, [initialData]);

  // Calculer le montant total automatiquement
  useEffect(() => {
    const details = form.watch("details");
    const total = details.reduce((sum, detail) => {
      return sum + (detail.heures_travaillees * detail.taux_horaire);
    }, 0);

    form.setValue("montant_total", total);
  }, [form.watch("details")]);

  const handleSubmit = (values: z.infer<typeof invoiceSchema>) => {
    onSubmit(values as FacturationFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Date de facturation */}
          <FormField
            control={form.control}
            name="date_facturation"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de facturation</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
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
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Intervention */}
          <FormField
            control={form.control}
            name="intervention_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intervention</FormLabel>
                <Select 
                  disabled={isSubmitting || initialData !== undefined} 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une intervention" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {interventions.map((intervention) => (
                      <SelectItem key={intervention.id} value={intervention.id}>
                        {intervention.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Statut de paiement */}
        <FormField
          control={form.control}
          name="statut_paiement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut de paiement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="payée">Payée</SelectItem>
                  <SelectItem value="annulée">Annulée</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Section des détails de facturation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Détails de facturation</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", heures_travaillees: 1, taux_horaire: 50 })}
              className="flex items-center"
            >
              <Plus className="mr-1 h-4 w-4" />
              Ajouter un détail
            </Button>
          </div>
          
          <Separator />
          
          {fields.map((field, index) => (
            <div key={field.id} className="relative rounded-md border p-4">
              <div className="absolute right-2 top-2">
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                {/* Description */}
                <FormField
                  control={form.control}
                  name={`details.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Heures travaillées */}
                <FormField
                  control={form.control}
                  name={`details.${index}.heures_travaillees`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heures travaillées</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0.5"
                          step="0.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Taux horaire */}
                <FormField
                  control={form.control}
                  name={`details.${index}.taux_horaire`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux horaire (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Montant (calculé) */}
                <FormItem>
                  <FormLabel>Montant</FormLabel>
                  <div className="h-10 rounded-md border border-input bg-background px-3 py-2">
                    {((form.watch(`details.${index}.heures_travaillees`) || 0) * 
                      (form.watch(`details.${index}.taux_horaire`) || 0)).toFixed(2)} €
                  </div>
                </FormItem>
              </div>
            </div>
          ))}
        </div>
        
        {/* Montant total */}
        <div className="flex justify-end">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Montant total</p>
            <p className="text-2xl font-bold">
              {form.watch("montant_total").toFixed(2)} €
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {initialData ? "Mettre à jour" : "Créer"} la facture
          </Button>
        </div>
      </form>
    </Form>
  );
}
