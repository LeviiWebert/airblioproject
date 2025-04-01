
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Plus, Clock, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const ClientDashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterventions: 0,
    enCours: 0,
    planifiees: 0,
    terminees: 0,
  });

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    fetchSession();
    
    // Simuler le chargement des statistiques (à remplacer par des appels API réels)
    setTimeout(() => {
      setStats({
        totalInterventions: 12,
        enCours: 3,
        planifiees: 5,
        terminees: 4,
      });
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session?.user.email}
          </p>
        </div>
        <Link to="/client/new-request">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalInterventions}</div>
            <p className="text-muted-foreground text-sm">Interventions totales</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.enCours}</div>
            <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <p>En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.planifiees}</div>
            <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              <p>Planifiées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.terminees}</div>
            <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
              <Check className="h-4 w-4 mr-1" />
              <p>Terminées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets contenu principal */}
      <Tabs defaultValue="interventions" className="mt-6">
        <TabsList className="mb-6 w-full max-w-md">
          <TabsTrigger value="interventions" className="flex-1">Mes interventions</TabsTrigger>
          <TabsTrigger value="demandes" className="flex-1">Mes demandes</TabsTrigger>
          <TabsTrigger value="factures" className="flex-1">Mes factures</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interventions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interventions en cours et à venir</CardTitle>
              <CardDescription>La liste de vos interventions planifiées et en cours d'exécution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="p-4">
                  {/* Contenu à implémenter plus tard: liste des interventions */}
                  <div className="text-center py-8 text-gray-500">
                    Vous n'avez pas d'interventions en cours ou à venir.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="demandes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes demandes d'intervention</CardTitle>
              <CardDescription>Liste de toutes vos demandes d'intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="p-4">
                  {/* Contenu à implémenter plus tard: liste des demandes */}
                  <div className="text-center py-8 text-gray-500">
                    Vous n'avez pas encore effectué de demandes d'intervention.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="factures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes factures</CardTitle>
              <CardDescription>Historique et statut de vos factures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="p-4">
                  {/* Contenu à implémenter plus tard: liste des factures */}
                  <div className="text-center py-8 text-gray-500">
                    Vous n'avez pas encore de factures.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDashboard;
