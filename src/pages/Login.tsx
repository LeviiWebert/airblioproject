
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
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
          redirectBasedOnUserType(data.session.user);
        } else {
          setCheckingSession(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const redirectBasedOnUserType = async (user: any) => {
    try {
      // Vérifier d'abord si l'utilisateur est un admin
      const { data: adminData } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', user.id)
        .eq('role', 'admin')
        .single();

      if (adminData) {
        console.log("Utilisateur identifié comme admin");
        navigate('/admin');
        return;
      }

      // Si ce n'est pas un admin, vérifier s'il est un client
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('id', user.id)
        .single();

      if (clientData) {
        console.log("Utilisateur identifié comme client");
        navigate('/client-dashboard');
        return;
      }

      // Si l'utilisateur n'a pas de profil, le déconnecter
      await supabase.auth.signOut();
      setError("Profil utilisateur incomplet. Veuillez contacter l'administrateur.");
      setCheckingSession(false);
    } catch (error) {
      console.error("Erreur lors de la redirection:", error);
      setCheckingSession(false);
    }
  };

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
        toast.success(`Connexion réussie`);
        redirectBasedOnUserType(data.session.user);
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      setError(error.message || "Une erreur s'est produite lors de la connexion");
      toast.error("Échec de la connexion. Veuillez vérifier vos identifiants.");
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

      // Après l'inscription, nous devons créer un enregistrement dans la table client ou utilisateurs
      if (data.user) {
        if (userType === "client") {
          const { error: clientError } = await supabase
            .from('clients')
            .insert([
              { id: data.user.id, email: email, nom_entreprise: email.split('@')[0] }
            ]);
          
          if (clientError) {
            throw new Error("Votre compte a été créé mais nous n'avons pas pu configurer votre profil client.");
          }
        } else if (userType === "admin") {
          const { error: adminError } = await supabase
            .from('utilisateurs')
            .insert([
              { id: data.user.id, email: email, nom: email.split('@')[0], role: 'admin' }
            ]);
          
          if (adminError) {
            throw new Error("Votre compte a été créé mais nous n'avons pas pu configurer votre profil administrateur.");
          }
        }
      }

      // Gérer la redirection ou l'affichage du message selon la configuration de Supabase
      if (data.session) {
        toast.success("Inscription réussie! Vous êtes maintenant connecté.");
        redirectBasedOnUserType(data.user);
      } else {
        setSuccessMessage("Inscription réussie! Vérifiez votre email pour confirmer votre compte.");
        toast.success("Vérifiez votre email pour confirmer votre inscription.");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      setError(error.message || "Une erreur s'est produite lors de l'inscription");
      toast.error(error.message || "Erreur lors de l'inscription");
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

export default Login;
