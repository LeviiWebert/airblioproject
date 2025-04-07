
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  MapPin, 
  MessageSquare, 
  User, 
  Wrench, 
  Clipboard, 
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { SmallLoading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Client {
  id: string;
  nom_entreprise: string;
  email: string;
  tel: string;
}

interface Team {
  id: string;
  nom: string;
  specialisation: string | null;
}

interface Equipment {
  id: string;
  reference: string;
  type_materiel: string;
  etat: string;
}

interface PVIntervention {
  id: string;
  validation_client: boolean | null;
  date_validation: string | null;
  commentaire: string | null;
}

interface Intervention {
  id: string;
  date_debut: string | null;
  date_fin: string | null;
  rapport: string | null;
  statut: string;
  localisation: string;
  demande_intervention_id: string;
  pv_intervention_id: string | null;
  teams?: Team[];
  equipment?: Equipment[];
  pv_interventions?: PVIntervention;
  created_at: string;
  updated_at: string;
}

interface DemandeIntervention {
  id: string;
  description: string;
  date_demande: string;
  urgence: string;
  statut: string;
  client_id: string;
  client?: Client;
  intervention?: Intervention;
}

const AdminInterventionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [demande, setDemande] = useState<DemandeIntervention | null>(null);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchInterventionDetails = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        
        // Fetch the intervention request with client data
        const { data: demandeData, error: demandeError } = await supabase
          .from('demande_interventions')
          .select(`
            id,
            description,
            date_demande,
            urgence,
            statut,
            intervention_id,
            client_id,
            client:client_id (
              id, 
              nom_entreprise,
              email,
              tel
            )
          `)
          .eq('id', id)
          .single();
          
        if (demandeError) throw demandeError;
        
        setDemande(demandeData);
        
        // Create a history entry for the request creation
        const history = [
          {
            date: demandeData.date_demande,
            type: 'creation',
            text: `Demande d'intervention créée par ${demandeData.client?.nom_entreprise || 'Client'}`,
            status: demandeData.statut
          }
        ];
        
        if (demandeData.intervention_id) {
          // Fetch intervention details
          const { data: interventionData, error: interventionError } = await supabase
            .from('interventions')
            .select(`
              id,
              date_debut,
              date_fin,
              rapport,
              statut,
              localisation,
              demande_intervention_id,
              pv_intervention_id,
              created_at,
              updated_at
            `)
            .eq('id', demandeData.intervention_id)
            .single();
          
          if (interventionError) throw interventionError;
          
          // Add intervention creation to history
          history.push({
            date: interventionData.created_at,
            type: 'intervention',
            text: `Intervention planifiée${interventionData.date_debut ? ` pour le ${format(new Date(interventionData.date_debut), "dd MMMM yyyy", { locale: fr })}` : ''}`,
            status: interventionData.statut
          });
          
          setIntervention(interventionData);
          
          // Fetch teams assigned to the intervention
          const { data: teamsData, error: teamsError } = await supabase
            .from('intervention_equipes')
            .select(`
              equipe_id,
              equipes:equipe_id (
                id,
                nom,
                specialisation
              )
            `)
            .eq('intervention_id', demandeData.intervention_id);
          
          if (!teamsError && teamsData) {
            const teams = teamsData.map(item => item.equipes);
            setIntervention(prev => ({
              ...prev!,
              teams: teams
            }));
            
            // Add team assignment to history
            if (teams.length > 0) {
              history.push({
                date: interventionData.updated_at,
                type: 'team',
                text: `Équipe${teams.length > 1 ? 's' : ''} assignée${teams.length > 1 ? 's' : ''} : ${teams.map(t => t.nom).join(', ')}`,
                status: interventionData.statut
              });
            }
          }
          
          // Fetch equipment assigned to the intervention
          const { data: equipmentData, error: equipmentError } = await supabase
            .from('intervention_materiels')
            .select(`
              materiel_id,
              materiels:materiel_id (
                id,
                reference,
                type_materiel,
                etat
              )
            `)
            .eq('intervention_id', demandeData.intervention_id);
          
          if (!equipmentError && equipmentData) {
            const equipment = equipmentData.map(item => item.materiels);
            setIntervention(prev => ({
              ...prev!,
              equipment: equipment
            }));
            
            // Add equipment assignment to history
            if (equipment.length > 0) {
              history.push({
                date: interventionData.updated_at,
                type: 'equipment',
                text: `Équipement${equipment.length > 1 ? 's' : ''} assigné${equipment.length > 1 ? 's' : ''} : ${equipment.map(e => e.reference).join(', ')}`,
                status: interventionData.statut
              });
            }
          }
          
          // Fetch PV if exists
          if (interventionData.pv_intervention_id) {
            const { data: pvData, error: pvError } = await supabase
              .from('pv_interventions')
              .select(`
                id,
                validation_client,
                date_validation,
                commentaire
              `)
              .eq('id', interventionData.pv_intervention_id)
              .single();
            
            if (!pvError && pvData) {
              setIntervention(prev => ({
                ...prev!,
                pv_interventions: pvData
              }));
              
              // Add PV creation to history
              history.push({
                date: interventionData.updated_at,
                type: 'pv',
                text: `Procès-verbal créé`,
                status: interventionData.statut
              });
              
              // Add PV validation to history if validated
              if (pvData.validation_client !== null) {
                const historyEntry = {
                  date: pvData.date_validation,
                  type: pvData.validation_client ? 'pv_validated' : 'pv_rejected',
                  text: pvData.validation_client 
                    ? 'Procès-verbal validé par le client' 
                    : 'Procès-verbal refusé par le client',
                  status: interventionData.statut
                };
                
                if (pvData.commentaire) {
                  history.push({
                    ...historyEntry,
                    text: historyEntry.text + (pvData.commentaire ? ` avec commentaire` : ''),
                    comment: pvData.commentaire
                  });
                } else {
                  history.push(historyEntry);
                }
              }
            }
          }
          
          // Add completion to history if completed
          if (interventionData.statut === 'terminée') {
            history.push({
              date: interventionData.date_fin || interventionData.updated_at,
              type: 'completion',
              text: `Intervention terminée`,
              status: 'terminée'
            });
          }
        }
        
        // Sort history by date
        history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setHistory(history);
        
      } catch (error) {
        console.error("Erreur lors du chargement de l'intervention:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les détails de l'intervention."
        });
        navigate('/admin/interventions');
      } finally {
        setLoading(false);
      }
    };

    fetchInterventionDetails();
  }, [id, navigate, toast]);

  const handleCreatePV = async () => {
    if (!intervention || !demande) return;
    
    try {
      const { data: pvData, error: pvError } = await supabase
        .from('pv_interventions')
        .insert({
          intervention_id: intervention.id,
          client_id: demande.client_id,
          validation_client: null,
          commentaire: null
        })
        .select('id')
        .single();
      
      if (pvError) throw pvError;
      
      // Update intervention with PV ID
      const { error: updateError } = await supabase
        .from('interventions')
        .update({ pv_intervention_id: pvData.id })
        .eq('id', intervention.id);
      
      if (updateError) throw updateError;
      
      toast({ title: "Succès", description: "Le PV a été créé avec succès." });
      
      // Refresh the page to see the changes
      window.location.reload();
      
    } catch (error) {
      console.error("Erreur lors de la création du PV:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le PV."
      });
    }
  };

  const handleViewPV = () => {
    if (intervention?.pv_intervention_id) {
      navigate(`/admin/pv/${intervention.pv_intervention_id}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non définie";
    return format(new Date(dateString), "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center">
          <SmallLoading />
        </div>
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Intervention non trouvée</h2>
            <p className="text-muted-foreground mb-4">
              Désolé, l'intervention que vous recherchez n'existe pas ou a été supprimée.
            </p>
            <Button onClick={() => navigate('/admin/interventions')}>
              Retour aux interventions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/admin/interventions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux interventions
        </Button>
        
        <div>
          {intervention && intervention.statut === 'terminée' && !intervention.pv_intervention_id && (
            <Button onClick={handleCreatePV}>
              <FileText className="mr-2 h-4 w-4" />
              Créer un PV d'intervention
            </Button>
          )}
          
          {intervention && intervention.pv_intervention_id && (
            <Button onClick={handleViewPV}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir le PV d'intervention
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Intervention #{demande.id.substring(0, 8).toUpperCase()}</span>
                <div className="flex space-x-2">
                  <InterventionStatusBadge status={intervention ? intervention.statut : demande.statut} />
                  <PriorityBadge priority={demande.urgence} />
                </div>
              </CardTitle>
              <CardDescription>
                Demande du {format(new Date(demande.date_demande), "dd MMMM yyyy", { locale: fr })}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="details" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="mb-4 grid grid-cols-3">
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="teams">Équipes & Matériel</TabsTrigger>
                  <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Informations client</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <User className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Client</p>
                            <p className="text-muted-foreground">{demande.client?.nom_entreprise || "Non spécifié"}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <MessageSquare className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Contact</p>
                            <p className="text-muted-foreground">{demande.client?.email || "Non spécifié"}</p>
                            <p className="text-muted-foreground">{demande.client?.tel || "Non spécifié"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Description de la demande</h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p className="whitespace-pre-line">{demande.description}</p>
                      </div>
                    </div>
                    
                    {intervention && (
                      <>
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Détails de l'intervention</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start">
                              <Clock className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">Date de début</p>
                                <p className="text-muted-foreground">{formatDate(intervention.date_debut)}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Calendar className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">Date de fin</p>
                                <p className="text-muted-foreground">{formatDate(intervention.date_fin)}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <MapPin className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">Localisation</p>
                                <p className="text-muted-foreground">{intervention.localisation || "Non spécifiée"}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <FileText className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">Statut de l'intervention</p>
                                <div className="mt-1">
                                  <InterventionStatusBadge status={intervention.statut} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {intervention.rapport && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Rapport d'intervention</h3>
                            <div className="bg-muted p-4 rounded-md">
                              <p className="whitespace-pre-line">{intervention.rapport}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="teams">
                  <div className="space-y-6">
                    {intervention?.teams && intervention.teams.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Équipes assignées</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {intervention.teams.map((team) => (
                            <Card key={team.id} className="bg-muted/50">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">{team.nom}</CardTitle>
                                <CardDescription>{team.specialisation || "Équipe technique"}</CardDescription>
                              </CardHeader>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-medium mb-1">Aucune équipe assignée</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Cette intervention n'a pas encore d'équipe assignée ou est en attente de planification.
                        </p>
                      </div>
                    )}
                    
                    <Separator />
                    
                    {intervention?.equipment && intervention.equipment.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Matériel utilisé</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {intervention.equipment.map((item) => (
                            <Card key={item.id} className="bg-muted/50">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">{item.reference}</CardTitle>
                                <CardDescription>Type: {item.type_materiel}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <Badge variant={item.etat === "disponible" ? "success" : 
                                  item.etat === "en utilisation" ? "warning" : "destructive"}>
                                  {item.etat}
                                </Badge>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Tool className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-medium mb-1">Aucun matériel assigné</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Cette intervention n'a pas encore de matériel assigné ou est en attente de planification.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="history">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-3">Historique de l'intervention</h3>
                    <div className="space-y-4">
                      {history.map((item: any, index) => (
                        <div key={index} className="flex">
                          <div className="mr-4 mt-1">
                            {item.type === 'creation' && <Info className="h-6 w-6 text-blue-500" />}
                            {item.type === 'intervention' && <Calendar className="h-6 w-6 text-indigo-500" />}
                            {item.type === 'team' && <User className="h-6 w-6 text-violet-500" />}
                            {item.type === 'equipment' && <Wrench className="h-6 w-6 text-orange-500" />}
                            {item.type === 'pv' && <FileText className="h-6 w-6 text-emerald-500" />}
                            {item.type === 'pv_validated' && <CheckCircle className="h-6 w-6 text-green-500" />}
                            {item.type === 'pv_rejected' && <AlertTriangle className="h-6 w-6 text-red-500" />}
                            {item.type === 'completion' && <Clipboard className="h-6 w-6 text-teal-500" />}
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-lg p-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                              <p className="font-medium">{item.text}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(item.date), "dd/MM/yyyy à HH:mm", { locale: fr })}
                              </p>
                            </div>
                            {item.status && (
                              <div className="mt-1 mb-2">
                                <InterventionStatusBadge status={item.status} />
                              </div>
                            )}
                            {item.comment && (
                              <div className="mt-2 bg-background p-2 rounded border">
                                <p className="text-sm text-muted-foreground">"{item.comment}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {history.length === 0 && (
                        <div className="text-center py-8">
                          <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <h3 className="text-lg font-medium mb-1">Aucun historique</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Aucune activité n'a été enregistrée pour cette intervention.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Numéro d'intervention</p>
                <p className="text-lg">#{demande.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Date de la demande</p>
                <p>{format(new Date(demande.date_demande), "dd/MM/yyyy", { locale: fr })}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Niveau d'urgence</p>
                <div className="mt-1">
                  <PriorityBadge priority={demande.urgence} />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Statut actuel</p>
                <div className="mt-1">
                  {intervention ? (
                    <InterventionStatusBadge status={intervention.statut} />
                  ) : (
                    <InterventionStatusBadge status={demande.statut} />
                  )}
                </div>
              </div>
              {intervention && intervention.date_debut && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Date programmée</p>
                    <p>{format(new Date(intervention.date_debut), "dd/MM/yyyy", { locale: fr })}</p>
                  </div>
                </>
              )}
              {intervention && intervention.pv_intervention_id && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">PV d'intervention</p>
                    <div className="mt-2">
                      {intervention.pv_interventions?.validation_client === null ? (
                        <Badge variant="outline">En attente de validation</Badge>
                      ) : intervention.pv_interventions?.validation_client ? (
                        <Badge variant="default" className="bg-green-500">Validé par le client</Badge>
                      ) : (
                        <Badge variant="destructive">Refusé par le client</Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button variant="outline" className="w-full" onClick={handleViewPV} disabled={!intervention || !intervention.pv_intervention_id}>
                <FileText className="mr-2 h-4 w-4" />
                Voir le PV d'intervention
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {intervention && intervention.statut === 'terminée' && !intervention.pv_intervention_id && (
                <Button className="w-full" onClick={handleCreatePV}>
                  <FileText className="mr-2 h-4 w-4" />
                  Créer un PV d'intervention
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  toast({
                    title: "Notification envoyée",
                    description: "Un rappel a été envoyé au client."
                  });
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Envoyer un rappel
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/admin/reports')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Accéder aux rapports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminInterventionDetails;
