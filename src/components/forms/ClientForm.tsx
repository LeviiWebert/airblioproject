
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
import { Client } from "@/types/models";

const clientSchema = z.object({
  nomEntreprise: z.string().min(2, { message: "Le nom de l'entreprise doit contenir au moins 2 caractères" }),
  email: z.string().email({ message: "Email invalide" }).optional().or(z.literal('')),
  tel: z.string().optional().or(z.literal('')),
  identifiant: z.string().optional().or(z.literal('')),
  mdp: z.string().optional().or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  onSubmit: (values: ClientFormValues) => void;
  initialData?: Partial<Client>;
  isSubmitting: boolean;
}

const ClientForm = ({ onSubmit, initialData, isSubmitting }: ClientFormProps) => {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nomEntreprise: initialData?.nomEntreprise || "",
      email: initialData?.email || "",
      tel: initialData?.tel || "",
      identifiant: initialData?.identifiant || "",
      mdp: initialData?.mdp || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nomEntreprise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'entreprise</FormLabel>
              <FormControl>
                <Input placeholder="Nom de l'entreprise" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input placeholder="Téléphone" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="identifiant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identifiant</FormLabel>
              <FormControl>
                <Input placeholder="Identifiant" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mdp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input placeholder="Mot de passe" type="password" {...field} />
              </FormControl>
              <FormMessage />
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

export default ClientForm;
