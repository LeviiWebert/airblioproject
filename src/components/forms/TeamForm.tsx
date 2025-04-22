
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Equipe } from "@/types/models";

const teamSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  specialisation: z.string().optional(),
  disponibilite: z.boolean().default(true)
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormProps {
  onSubmit: (values: TeamFormValues) => void;
  initialData?: Partial<Equipe>;
  isSubmitting: boolean;
}

const TeamForm = ({ onSubmit, initialData, isSubmitting }: TeamFormProps) => {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      nom: initialData?.nom || "",
      specialisation: initialData?.specialisation || "",
      disponibilite: initialData?.disponibilite ?? true
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'équipe</FormLabel>
              <FormControl>
                <Input placeholder="Nom de l'équipe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="specialisation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spécialisation</FormLabel>
              <FormControl>
                <Input placeholder="Spécialisation de l'équipe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="disponibilite"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Disponibilité</FormLabel>
                <FormLabel className="text-sm text-muted-foreground">
                  Indique si l'équipe est actuellement disponible
                </FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Traitement en cours...
            </span>
          ) : initialData?.id ? "Mettre à jour" : "Créer" }
        </Button>
      </form>
    </Form>
  );
};

export default TeamForm;
