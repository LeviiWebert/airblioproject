
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { Eye, Calendar, Clock, CheckCircle, FileText, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const InterventionsList = () => {
  const { toast } = useToast();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("Utilisateur non connecté");
        }

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
          .eq('client_id', user.id)
          .order('date_demande', { ascending: false });
          
        if (demandesError) throw demandesError;

        setInterventions(demandes || []);
      } catch (error: any) {
        console.error("Erreur lors du chargement des interventions:", error);
        toast({
          variant: "destructive", 
          title: "Erreur",
          description: "Impossible de charger vos interventions. Veuillez réessayer ultérieurement."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterventions();
  }, [toast]);

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non planifiée";
    return format(new Date(dateString), "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Mes interventions</h1>
            <p className="text-muted-foreground">Consultez et suivez toutes vos interventions</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link to="/intervention/request">
                Nouvelle demande
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Toutes ({interventions.length})</TabsTrigger>
            <TabsTrigger value="pending">En attente ({getPendingInterventions().length})</TabsTrigger>
            <TabsTrigger value="active">En cours ({getActiveInterventions().length})</TabsTrigger>
            <TabsTrigger value="completed">Terminées ({getCompletedInterventions().length})</TabsTrigger>
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
        </Tabs>
      </div>
    </ClientLayout>
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

                    <div className="mt-4 md:mt-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/client/intervention/${item.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les détails
                        </Link>
                      </Button>
                    </div>
                  </div>

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
