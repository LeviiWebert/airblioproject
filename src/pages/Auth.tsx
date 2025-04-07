
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { SmallLoading } from "@/components/ui/loading";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, loading, session, userType, initialized } = useAuth();
  const returnTo = location.state?.returnTo || '/';
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [userTypeSelection, setUserTypeSelection] = useState<"admin" | "client">("client");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Rediriger si déjà authentifié
  useEffect(() => {
    console.log("Auth page effect - initialized:", initialized, "session:", !!session, "userType:", userType);
    
    if (initialized && session) {
      setIsRedirecting(true);
      console.log("Session active détectée, redirection en cours...");
      
      // Petit délai pour éviter les problèmes de redirection
      setTimeout(() => {
        if (userType === "admin") {
          navigate("/admin");
        } else if (userType === "client") {
          navigate(returnTo === '/' ? "/client-dashboard" : returnTo);
        } else {
          // Si le type d'utilisateur n'est pas encore déterminé mais qu'il y a une session
          // On le redirige vers l'index qui saura gérer ce cas
          navigate("/index");
        }
      }, 100);
    }
  }, [initialized, session, userType, navigate, returnTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLocalLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Veuillez remplir tous les champs");
      }

      console.log("Tentative de connexion:", email);
      const resultUserType = await signIn(email, password);
      
      // La redirection est gérée dans le useEffect qui observe session et userType
      console.log("Type d'utilisateur après connexion:", resultUserType);
    } catch (error: any) {
      console.error("Erreur lors de la connexion:", error);
      setError(error.message || "Erreur de connexion");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLocalLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Veuillez remplir tous les champs");
      }

      // Vérification de la force du mot de passe
      if (password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      console.log("Tentative d'inscription:", email);
      const resultUserType = await signUp(email, password, userTypeSelection);
      
      if (resultUserType) {
        // Si l'inscription crée immédiatement une session (email confirmation désactivé)
        console.log("Inscription réussie avec session active:", resultUserType);
      } else {
        // Si l'inscription nécessite une confirmation par email
        console.log("Inscription réussie, confirmation par email requise");
        setSuccessMessage("Inscription réussie! Vérifiez votre email pour confirmer votre compte.");
      }
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error);
      setError(error.message || "Erreur d'inscription");
    } finally {
      setLocalLoading(false);
    }
  };

  // Afficher le spinner pendant le chargement initial
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <SmallLoading />
      </div>
    );
  }

  // Si on est en train de rediriger
  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <SmallLoading />
          <p className="mt-4 text-muted-foreground">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est déjà connecté mais qu'on n'a pas encore commencé la redirection
  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <SmallLoading />
          <p className="mt-4 text-muted-foreground">Vous êtes connecté, redirection en cours...</p>
        </div>
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
                      value={userTypeSelection} 
                      onValueChange={(value) => setUserTypeSelection(value as "admin" | "client")}
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
                      disabled={localLoading}
                      className="bg-white"
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
                      disabled={localLoading}
                      className="bg-white"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={localLoading}>
                    {localLoading ? (
                      <><span className="mr-2">Connexion en cours</span>
                      <span className="animate-pulse">...</span></>
                    ) : (
                      "Se connecter"
                    )}
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
                      value={userTypeSelection} 
                      onValueChange={(value) => setUserTypeSelection(value as "admin" | "client")}
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
                      disabled={localLoading}
                      className="bg-white"
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
                      disabled={localLoading}
                      className="bg-white"
                    />
                    <p className="text-xs text-gray-500">Le mot de passe doit contenir au moins 6 caractères</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={localLoading}>
                    {localLoading ? (
                      <><span className="mr-2">Inscription en cours</span>
                      <span className="animate-pulse">...</span></>
                    ) : (
                      "S'inscrire"
                    )}
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
