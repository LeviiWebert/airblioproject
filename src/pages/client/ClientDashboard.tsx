
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, ExternalLink, PlusCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ClientDashboard = () => {
  const { toast } = useToast();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndInterventions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("Utilisateur non authentifié");
        }
        
        setClientId(user.id);
        
        const { data, error } = await supabase
          .from('demande_interventions')
          .select(`
            id,
            date_demande,
            description,
            urgence,
            statut,
            intervention_id
          `)
          .eq('client_id', user.id)
          .order('date_demande', { ascending: false });
          
        if (error) throw error;
        
        setInterventions(data || []);
      } catch (error: any) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          variant: "destructive", 
          title: "Erreur",
          description: "Impossible de charger vos interventions. Veuillez réessayer ultérieurement."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndInterventions();
  }, [toast]);

  const getInterventionsByStatus = (status: string) => {
    return interventions.filter(intervention => intervention.statut === status);
  };

  const getPendingInterventions = () => {
    return interventions.filter(intervention => 
      ["en_attente", "en_cours_analyse", "validée"].includes(intervention.statut)
    );
  };

  const getActiveInterventions = () => {
    return interventions.filter(intervention => 
      ["planifiée", "en_cours"].includes(intervention.statut)
    );
  };

  const getCompletedInterventions = () => {
    return interventions.filter(intervention => 
      ["terminée"].includes(intervention.statut)
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue sur votre espace client</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/intervention/request">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle demande d'intervention
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demandes en attente
            </CardTitle>
            <CardDescription className="text-3xl font-bold">
              {loading ? "..." : getPendingInterventions().length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Non planifiées
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interventions actives
            </CardTitle>
            <CardDescription className="text-3xl font-bold">
              {loading ? "..." : getActiveInterventions().length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <FileText className="h-4 w-4 mr-1" />
              En cours ou planifiées
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interventions terminées
            </CardTitle>
            <CardDescription className="text-3xl font-bold">
              {loading ? "..." : getCompletedInterventions().length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-4 w-4 mr-1" />
              Archivées
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes les demandes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="active">Actives</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              {interventions.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="mb-4">Vous n'avez pas encore de demandes d'intervention.</p>
                    <Link to="/intervention/request">
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Créer une demande
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                renderInterventionsList(interventions)
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {getPendingInterventions().length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p>Aucune demande en attente.</p>
                  </CardContent>
                </Card>
              ) : (
                renderInterventionsList(getPendingInterventions())
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {getActiveInterventions().length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p>Aucune intervention active en ce moment.</p>
                  </CardContent>
                </Card>
              ) : (
                renderInterventionsList(getActiveInterventions())
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {getCompletedInterventions().length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p>Aucune intervention terminée.</p>
                  </CardContent>
                </Card>
              ) : (
                renderInterventionsList(getCompletedInterventions())
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
  
  function renderInterventionsList(interventions: any[]) {
    return (
      <div className="space-y-4">
        {interventions.map((intervention) => (
          <Card key={intervention.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1">
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        Intervention #{intervention.id.substring(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {intervention.description.length > 100 
                          ? `${intervention.description.substring(0, 100)}...` 
                          : intervention.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <InterventionStatusBadge status={intervention.statut} />
                      <PriorityBadge priority={intervention.urgence} />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Créée le {format(new Date(intervention.date_demande), "dd/MM/yyyy", { locale: fr })}
                    </div>
                    <Link to={`/client/intervention/${intervention.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Voir le récapitulatif
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
};

export default ClientDashboard;
