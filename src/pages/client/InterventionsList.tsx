import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { Eye, Calendar, Clock, AlertCircle, MapPin, User, RefreshCcw, Edit } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

const InterventionsList = () => {
  const { toast } = useToast();
  const { clientId } = useAuth();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInterventions = async () => {
    if (!clientId) {
      setLoading(false);
      setError("Votre profil client n'est pas correctement configuré");
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'identifier votre compte client. Veuillez vous reconnecter."
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log("Chargement des interventions pour le client ID:", clientId);
      
      // Set a timeout to prevent infinite loading
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      loadTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        setError("Le chargement a pris trop de temps. Veuillez réessayer.");
        toast({
          variant: "destructive", 
          title: "Délai de chargement dépassé",
          description: "La récupération des données a pris trop de temps. Veuillez réessayer."
        });
      }, 10000); // 10 seconds timeout
      
      // Récupérer toutes les demandes d'intervention du client
      const { data: demandes, error: demandesError } = await supabase
        .from('demande_interventions')
        .select(`
          id,
          date_demande,
          description,
          urgence,
          statut,
          intervention_id,
          interventions:intervention_id (
            id,
            date_debut,
            date_fin,
            rapport,
            localisation,
            statut,
            intervention_equipes:intervention_equipes (
              equipe_id,
              equipes:equipes (
                id,
                nom,
                specialisation
              )
            ),
            pv_intervention_id
          )
        `)
        .eq('client_id', clientId)
        .order('date_demande', { ascending: false });
        
      // Clear the timeout as data has been fetched
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
        
      if (demandesError) {
        console.error("Erreur lors du chargement des interventions:", demandesError);
        setError("Impossible de charger vos interventions");
        toast({
          variant: "destructive", 
          title: "Erreur",
          description: "Impossible de charger vos interventions. Veuillez réessayer ultérieurement."
        });
      } else {
        console.log("Interventions chargées avec succès:", demandes?.length || 0);
        setInterventions(demandes || []);
      }
    } catch (error: any) {
      console.error("Exception lors du chargement des interventions:", error);
      setError("Une erreur est survenue lors du chargement de vos interventions");
      toast({
        variant: "destructive", 
        title: "Erreur",
        description: "Impossible de charger vos interventions. Veuillez réessayer ultérieurement."
      });
    } finally {
      setLoading(false);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }
  };

  useEffect(() => {
    fetchInterventions();
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [toast, clientId]);

  const getPendingInterventions = () => {
    return interventions.filter(intervention => 
      ["en_attente", "validée", "en_cours_analyse"].includes(intervention.statut) 
      && !intervention.intervention_id
    );
  };

  const getActiveInterventions = () => {
    return interventions.filter(intervention => 
      intervention.intervention_id && 
      intervention.interventions?.statut && 
      ["planifiée", "en_cours"].includes(intervention.interventions.statut)
    );
  };

  const getCompletedInterventions = () => {
    return interventions.filter(intervention => 
      intervention.intervention_id && 
      intervention.interventions?.statut && 
      ["terminée"].includes(intervention.interventions.statut)
    );
  };

  const getRejectedInterventions = () => {
    return interventions.filter(intervention => 
      intervention.statut === 'rejetée'
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non planifiée";
    return format(new Date(dateString), "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  const handleRetry = () => {
    fetchInterventions();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mes interventions</h1>
          <p className="text-muted-foreground">Consultez et suivez toutes vos interventions</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          {!loading && (
            <Button variant="outline" onClick={handleRetry} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          )}
          <Button asChild>
            <Link to="/intervention/request">
              Nouvelle demande
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Chargement de vos interventions...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleRetry} className="mr-2">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <Button variant="outline" asChild>
                <Link to="/client-dashboard">
                  Retour au tableau de bord
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Toutes ({interventions.length})</TabsTrigger>
            <TabsTrigger value="pending">En attente ({getPendingInterventions().length})</TabsTrigger>
            <TabsTrigger value="active">En cours ({getActiveInterventions().length})</TabsTrigger>
            <TabsTrigger value="completed">Terminées ({getCompletedInterventions().length})</TabsTrigger>
            <TabsTrigger value="rejected">Refusées ({getRejectedInterventions().length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {interventions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">Vous n'avez pas encore d'interventions.</p>
                  <Button asChild>
                    <Link to="/intervention/request">
                      Faire une demande d'intervention
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              renderInterventionsList(interventions)
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {getPendingInterventions().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Vous n'avez pas d'interventions en attente.</p>
                </CardContent>
              </Card>
            ) : (
              renderInterventionsList(getPendingInterventions())
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {getActiveInterventions().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Vous n'avez pas d'interventions en cours.</p>
                </CardContent>
              </Card>
            ) : (
              renderInterventionsList(getActiveInterventions())
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {getCompletedInterventions().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Vous n'avez pas d'interventions terminées.</p>
                </CardContent>
              </Card>
            ) : (
              renderInterventionsList(getCompletedInterventions())
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {getRejectedInterventions().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Vous n'avez pas d'interventions refusées.</p>
                </CardContent>
              </Card>
            ) : (
              renderInterventionsList(getRejectedInterventions())
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  function renderInterventionsList(interventionsList: any[]) {
    return (
      <div className="grid gap-4">
        {interventionsList.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row border-b last:border-0">
                <div className="p-6 flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">
                          Intervention #{item.id.substring(0, 8).toUpperCase()}
                        </h3>
                        {item.intervention_id ? (
                          <InterventionStatusBadge status={item.interventions?.statut || "en_attente"} />
                        ) : (
                          <InterventionStatusBadge status={item.statut} />
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>
                          Demande du {format(new Date(item.date_demande), "dd/MM/yyyy", { locale: fr })}
                        </span>
                        <PriorityBadge priority={item.urgence} className="ml-2" />
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/client/intervention/${item.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les détails
                        </Link>
                      </Button>
                      
                      {/* Add the edit button with proper link to modification page */}
                      {item.intervention_id && (
                        <Button variant="default" size="sm" asChild>
                          <Link to={`/admin/interventions/new?interventionId=${item.intervention_id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Affichage du motif de refus si la demande a été rejetée */}
                  {item.statut === 'rejetée' && item.motif_rejet && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>
                        <strong>Motif du refus : </strong> {item.motif_rejet}
                      </AlertDescription>
                    </Alert>
                  )}

                  <p className="text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {item.intervention_id && (
                      <>
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Date prévue</p>
                            <p className="font-medium">
                              {formatDate(item.interventions?.date_debut)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Localisation</p>
                            <p className="font-medium line-clamp-1">
                              {item.interventions?.localisation || "À déterminer"}
                            </p>
                          </div>
                        </div>

                        {item.interventions?.intervention_equipes && 
                        item.interventions.intervention_equipes.length > 0 && (
                          <div className="flex items-center text-sm">
                            <User className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Équipe</p>
                              <p className="font-medium">
                                {item.interventions.intervention_equipes
                                  .map((eq: any) => eq.equipes?.nom)
                                  .filter(Boolean)
                                  .join(", ") || "Non assignée"}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
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

export default InterventionsList;
