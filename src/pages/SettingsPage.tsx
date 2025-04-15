
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, User, Bell, ShieldAlert, RefreshCcw } from "lucide-react";

const SettingsPage = () => {
  const { toast: toastHook } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formValues, setFormValues] = useState({
    email: "",
    name: "",
    notifications: true,
    twoFactorAuth: false
  });

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Tenter de récupérer le profil depuis la table des administrateurs
      const { data: adminData, error: adminError } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();
      
      // Si on ne trouve pas dans les administrateurs, chercher dans les clients
      if (!adminData) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user?.id)
          .maybeSingle();
        
        if (clientData) {
          setUserProfile(clientData);
          setFormValues({
            email: clientData.email || "",
            name: clientData.nom_entreprise || "",
            notifications: true,
            twoFactorAuth: false
          });
        }
      } else {
        setUserProfile(adminData);
        setFormValues({
          email: adminData.email || "",
          name: adminData.nom || "",
          notifications: true,
          twoFactorAuth: false
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement du profil:", error);
      toastHook({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les informations du profil.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (!userProfile) return;
      
      // Déterminer si c'est un administrateur ou un client
      const isAdmin = 'role' in userProfile;
      const table = isAdmin ? 'utilisateurs' : 'clients';
      const nameField = isAdmin ? 'nom' : 'nom_entreprise';
      
      const { error } = await supabase
        .from(table)
        .update({
          email: formValues.email,
          [nameField]: formValues.name
        })
        .eq('id', userProfile.id);
      
      if (error) throw error;
      
      toastHook({
        title: "Paramètres mis à jour",
        description: "Vos paramètres ont été mis à jour avec succès.",
      });
      
      toast.success("Paramètres enregistrés avec succès");
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour des paramètres:", error);
      toastHook({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos préférences et informations de compte.
        </p>
      </div>
      
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Informations du profil
                </CardTitle>
                <CardDescription>
                  Modifiez vos informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input 
                      id="name" 
                      value={formValues.name} 
                      onChange={(e) => handleChange("name", e.target.value)} 
                      placeholder="Votre nom"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formValues.email} 
                      onChange={(e) => handleChange("email", e.target.value)} 
                      placeholder="Votre email"
                    />
                  </div>
                  
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Préférences de notifications
              </CardTitle>
              <CardDescription>
                Configurez comment et quand nous vous contactons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notifications par email</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevez des emails concernant vos interventions
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={formValues.notifications}
                  onCheckedChange={(checked) => handleChange("notifications", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="updates-notifications">Mises à jour et nouvelles fonctionnalités</Label>
                  <div className="text-sm text-muted-foreground">
                    Soyez informé des nouvelles fonctionnalités de la plateforme
                  </div>
                </div>
                <Switch
                  id="updates-notifications"
                  checked={formValues.notifications}
                  onCheckedChange={(checked) => handleChange("notifications", checked)}
                />
              </div>
              
              <Button className="mt-4" onClick={() => toast.success("Préférences de notifications enregistrées")}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les préférences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" /> Sécurité du compte
              </CardTitle>
              <CardDescription>
                Gérez les paramètres de sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor">Authentification à deux facteurs</Label>
                  <div className="text-sm text-muted-foreground">
                    Ajoute une couche de sécurité supplémentaire à votre compte
                  </div>
                </div>
                <Switch
                  id="two-factor"
                  checked={formValues.twoFactorAuth}
                  onCheckedChange={(checked) => handleChange("twoFactorAuth", checked)}
                />
              </div>
              
              <div className="space-y-2 pt-4">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input id="current-password" type="password" placeholder="••••••••" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input id="new-password" type="password" placeholder="••••••••" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input id="confirm-password" type="password" placeholder="••••••••" />
              </div>
              
              <Button className="mt-4" onClick={() => toast.success("Paramètres de sécurité enregistrés")}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Mettre à jour le mot de passe
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
