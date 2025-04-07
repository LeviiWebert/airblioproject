import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, ExternalLink, PlusCircle, Eye, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const ClientDashboard = () => {
  const { toast } = useToast();
  const { user, clientId } = useAuth();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [techniciens, setTechniciens] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndInterventions = async () => {
      if (!user || !clientId) {
        console.log("Pas d'utilisateur ou d'ID client disponible");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Chargement des données pour le client ID:", clientId);
        
        // Récupérer les informations du client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .maybeSingle(); // Using maybeSingle instead of single to avoid errors
          
        if (clientError) {
          console.error("Erreur lors de la récupération des données client:", clientError);
          toast({
            variant: "destructive", 
            title: "Erreur",
            description: "Impossible de charger vos informations client."
          });
        } else if (clientData) {
          setClientData(clientData);
        }
        
        // Récupérer toutes les demandes d'intervention du client
        const { data: demandesData, error: demandesError } = await supabase
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
              statut
            )
          `)
          .eq('client_id', clientId)
          .order('date_demande', { ascending: false });
          
        if (demandesError) {
          console.error("Erreur lors de la récupération des demandes:", demandesError);
          toast({
            variant: "destructive", 
            title: "Erreur",
            description: "Impossible de charger vos interventions."
          });
        } else {
          setInterventions(demandesData || []);
          
          // Récupérer les équipes d'intervention pour les demandes
          if (demandesData && demandesData.length > 0) {
            // Filtrer pour ne récupérer que les interventions qui ont un ID
            const interventionIds = demandesData
              .filter(demande => demande.intervention_id)
              .map(demande => demande.intervention_id);
              
            if (interventionIds.length > 0) {
              // Récupérer les équipes par intervention
              const { data: interventionEquipes, error: equipesError } = await supabase
                .from('intervention_equipes')
                .select(`
                  equipe_id,
                  intervention_id,
                  equipes:equipe_id (
                    id,
                    nom,
                    specialisation
                  )
                `)
                .in('intervention_id', interventionIds);
                
              if (equipesError) {
                console.error("Erreur lors de la récupération des équipes:", equipesError);
              } else if (interventionEquipes && interventionEquipes.length > 0) {
                const equipeIds = interventionEquipes
                  .map(ie => ie.equipe_id)
                  .filter((id): id is string => id !== null);
                
                if (equipeIds.length > 0) {
                  // Récupérer les membres des équipes
                  const { data: equipeMembres, error: equipeMembresError } = await supabase
                    .from('equipe_membres')
                    .select(`
                      equipe_id,
                      utilisateur:utilisateur_id (
                        id,
                        nom,
                        role,
                        email,
                        disponibilite
                      )
                    `)
                    .in('equipe_id', equipeIds);
                    
                  if (equipeMembresError) {
                    console.error("Erreur lors de la récupération des membres d'équipe:", equipeMembresError);
                  } else if (equipeMembres) {
                    // Extraire les techniciens uniques par ID
                    const technicienMap = new Map();
                    equipeMembres.forEach((membre: any) => {
                      if (membre.utilisateur && membre.utilisateur.role === 'technicien') {
                        technicienMap.set(membre.utilisateur.id, membre.utilisateur);
                      }
                    });
                    
                    setTechniciens(Array.from(technicienMap.values()));
                  }
                }
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Erreur générale lors du chargement des données:", error);
        toast({
          variant: "destructive", 
          title: "Erreur",
          description: "Impossible de charger vos interventions. Veuillez réessayer ultérieurement."
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (clientId) {
      fetchUserAndInterventions();
    } else {
      setLoading(false);
    }
  }, [toast, user, clientId]);

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
      intervention.statut === "rejetée"
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue dans votre espace client, {clientData?.nom_entreprise || "Client"}
          </p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
              En cours d'analyse ou validées
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
              Complétées
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demandes refusées
            </CardTitle>
            <CardDescription className="text-3xl font-bold">
              {loading ? "..." : getRejectedInterventions().length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <ExternalLink className="h-4 w-4 mr-1" />
              Non validées
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Interventions récentes</CardTitle>
            <CardDescription>
              Vos dernières demandes et interventions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : interventions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4">Vous n'avez pas encore de demandes d'intervention.</p>
                <Link to="/intervention/request">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Créer une demande
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                {interventions.slice(0, 5).map((intervention) => (
                  <div 
                    key={intervention.id} 
                    className="border-b last:border-0 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            #{intervention.id.substring(0, 8).toUpperCase()}
                          </h3>
                          {intervention.intervention_id ? (
                            <InterventionStatusBadge status={intervention.interventions?.statut || "en_attente"} />
                          ) : (
                            <InterventionStatusBadge status={intervention.statut} />
                          )}
                          <PriorityBadge priority={intervention.urgence} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(intervention.date_demande), "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <Link to={`/client/intervention/${intervention.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      </Link>
                    </div>
                    <p className="text-sm line-clamp-1">
                      {intervention.description}
                    </p>
                  </div>
                ))}
                {interventions.length > 5 && (
                  <div className="p-4 text-center">
                    <Link to="/client/interventions">
                      <Button variant="outline" size="sm">
                        Voir toutes les interventions
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Votre équipe technique</CardTitle>
            <CardDescription>
              Techniciens qui ont travaillé sur vos interventions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : techniciens.length === 0 ? (
              <div className="text-center py-4">
                <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucun technicien n'est encore assigné à vos interventions
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {techniciens.map((tech) => (
                  <div key={tech.id} className="flex flex-col items-center text-center p-2 border rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm">{tech.nom}</h4>
                    <p className="text-xs text-muted-foreground">Technicien</p>
                    <div className={`h-2 w-2 rounded-full mt-1 ${tech.disponibilite ? "bg-green-500" : "bg-red-500"}`}></div>
                  </div>
                ))}
              </div>
            )}
            {techniciens.length > 0 && (
              <div className="text-center mt-4">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  Contacter l'équipe
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accès direct aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
              <Link to="/intervention/request" className="p-6 hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
                <PlusCircle className="h-10 w-10 text-primary mb-2" />
                <h3 className="font-semibold">Nouvelle demande</h3>
                <p className="text-sm text-muted-foreground mt-1">Créer une nouvelle demande d'intervention</p>
              </Link>
              <Link to="/client/interventions" className="p-6 hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
                <FileText className="h-10 w-10 text-primary mb-2" />
                <h3 className="font-semibold">Mes interventions</h3>
                <p className="text-sm text-muted-foreground mt-1">Consulter l'historique de vos interventions</p>
              </Link>
              <Link to="/client/profile" className="p-6 hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
                <User className="h-10 w-10 text-primary mb-2" />
                <h3 className="font-semibold">Mon profil</h3>
                <p className="text-sm text-muted-foreground mt-1">Gérer vos informations personnelles</p>
              </Link>
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
