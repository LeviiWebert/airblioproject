
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<"admin" | "client">("client");
  const [checkingSession, setCheckingSession] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà connecté au chargement de la page
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          const userMetadata = data.session.user.user_metadata;
          const currentUserType = userMetadata?.user_type || "client";
          
          console.log("Session trouvée:", data.session);
          console.log("Type d'utilisateur:", currentUserType);
          
          // Rediriger en fonction du type d'utilisateur
          if (currentUserType === "admin") {
            navigate("/admin");
          } else {
            navigate("/client-dashboard");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        console.log("Connexion réussie:", data.session);
        
        // Rediriger en fonction du type d'utilisateur détecté côté serveur
        // Cela sera géré par les hooks d'authentification selon le profil
        toast.success(`Connexion réussie`);
        
        if (userType === "admin") {
          navigate("/admin");
        } else {
          navigate("/client-dashboard");
        }
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      setError(error.message || "Une erreur s'est produite lors de la connexion");
      toast.error("Échec de la connexion. Veuillez vérifier vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Vérification de la force du mot de passe
      if (password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType
          }
        }
      });

      if (error) throw error;

      console.log("Inscription réussie:", data);
      
      // Après l'inscription, nous devons créer un enregistrement dans la table client ou utilisateurs
      if (userType === "client") {
        // Créer un enregistrement dans la table clients
        if (data.user) {
          const { error: clientError } = await supabase
            .from('clients')
            .insert([
              { id: data.user.id, email: email, nom_entreprise: email.split('@')[0] }
            ]);
          
          if (clientError) {
            console.error("Erreur lors de la création du profil client:", clientError);
            throw new Error("Votre compte a été créé mais nous n'avons pas pu configurer votre profil client. Veuillez contacter l'administrateur.");
          }
        }
      } else if (userType === "admin") {
        // Créer un enregistrement dans la table utilisateurs avec le rôle admin
        if (data.user) {
          const { error: adminError } = await supabase
            .from('utilisateurs')
            .insert([
              { id: data.user.id, email: email, nom: email.split('@')[0], role: 'admin' }
            ]);
          
          if (adminError) {
            console.error("Erreur lors de la création du profil admin:", adminError);
            throw new Error("Votre compte a été créé mais nous n'avons pas pu configurer votre profil administrateur. Veuillez contacter l'administrateur du système.");
          }
        }
      }

      // Si Supabase confirme l'email est désactivé
      if (data.session) {
        toast.success("Inscription réussie! Vous êtes maintenant connecté.");
        if (userType === "admin") {
          navigate("/admin");
        } else {
          navigate("/client-dashboard");
        }
      } else {
        // Si Supabase confirme l'email est activé
        setSuccessMessage("Inscription réussie! Vérifiez votre email pour confirmer votre compte.");
        toast.success("Vérifiez votre email pour confirmer votre inscription.");
      }
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      setError(error.message || "Une erreur s'est produite lors de l'inscription");
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold">GestInt - Sous-Marine</h1>
            <p className="text-muted-foreground">Gestion des interventions sous-marines</p>
          </Link>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Connexion</CardTitle>
                <CardDescription>
                  Connectez-vous pour accéder à votre espace de gestion
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="userType">Se connecter en tant que</Label>
                    <RadioGroup 
                      value={userType} 
                      onValueChange={(value) => setUserType(value as "admin" | "client")}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="client" id="client" />
                        <Label htmlFor="client">Client</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="admin" />
                        <Label htmlFor="admin">Administrateur</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Button type="button" variant="link" className="px-0 h-auto">
                        Mot de passe oublié?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Connexion en cours..." : "Se connecter"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Créer un compte</CardTitle>
                <CardDescription>
                  Inscrivez-vous pour accéder à la plateforme
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {successMessage && (
                    <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                      <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="userTypeRegister">S'inscrire en tant que</Label>
                    <RadioGroup 
                      value={userType} 
                      onValueChange={(value) => setUserType(value as "admin" | "client")}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="client" id="clientRegister" />
                        <Label htmlFor="clientRegister">Client</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="adminRegister" />
                        <Label htmlFor="adminRegister">Administrateur</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Mot de passe</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500">Le mot de passe doit contenir au moins 6 caractères</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Inscription en cours..." : "S'inscrire"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
