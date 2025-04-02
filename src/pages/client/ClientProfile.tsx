
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, User } from "lucide-react";

const profileSchema = z.object({
  nomEntreprise: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères" }),
  tel: z.string().optional(),
  email: z.string().email({ message: "Veuillez entrer une adresse email valide" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ClientProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nomEntreprise: "",
      tel: "",
      email: "",
    },
  });

  useEffect(() => {
    const fetchClientProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        // Récupérer les infos du client
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setClientData(data);
          form.reset({
            nomEntreprise: data.nom_entreprise || "",
            tel: data.tel || "",
            email: data.email || user.email || "",
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger votre profil. Veuillez réessayer."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClientProfile();
  }, [navigate, toast, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { error } = await supabase
        .from('clients')
        .update({
          nom_entreprise: values.nomEntreprise,
          tel: values.tel,
          email: values.email,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès."
      });

    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil. Veuillez réessayer."
      });
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mon profil</h1>
          <p className="text-muted-foreground">Consultez et modifiez vos informations personnelles</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
              <CardDescription>Modifiez vos informations de contact</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nomEntreprise"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'entreprise</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de votre entreprise" {...field} />
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
                          <Input type="email" placeholder="votre@email.com" {...field} />
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
                          <Input placeholder="+33 6 XX XX XX XX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full md:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-lg font-medium">{clientData?.nom_entreprise}</h3>
              <p className="text-sm text-muted-foreground">{clientData?.email}</p>
              
              <div className="w-full border-t my-4"></div>
              
              <div className="w-full text-left">
                <p className="text-sm"><span className="font-medium">Identifiant client:</span> {clientData?.id?.substring(0, 8).toUpperCase()}</p>
                <p className="text-sm"><span className="font-medium">Date d'inscription:</span> {clientData?.created_at ? new Date(clientData.created_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate('/client/interventions')}>
                Voir mes interventions
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientProfile;
