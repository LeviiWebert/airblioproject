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
  ExternalLink,
  Printer,
  Edit
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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

interface HistoryItem {
  date: string;
  type: string;
  text: string;
  status: string;
  commentaire?: string;
}

const AdminInterventionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [demande, setDemande] = useState<DemandeIntervention | null>(null);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchInterventionDetails = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        
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
          .eq('id', id)
          .maybeSingle();
        
        if (interventionError) throw interventionError;
        
        if (!interventionData) {
          setLoading(false);
          return;
        }
        
        setIntervention(interventionData);
        
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
          .eq('id', interventionData.demande_intervention_id)
          .maybeSingle();
        
        if (demandeError) throw demandeError;
        
        if (!demandeData) {
          console.warn("Demande d'intervention non trouvée pour l'ID:", interventionData.demande_intervention_id);
        } else {
          setDemande(demandeData);
        }
        
        const history: HistoryItem[] = [];
        
        if (demandeData) {
          history.push({
            date: demandeData.date_demande,
            type: 'creation',
            text: `Demande d'intervention créée par ${demandeData.client?.nom_entreprise || 'Client'}`,
            status: demandeData.statut
          });
        }
        
        history.push({
          date: interventionData.created_at,
          type: 'intervention',
          text: `Intervention planifiée${interventionData.date_debut ? ` pour le ${format(new Date(interventionData.date_debut), "dd MMMM yyyy", { locale: fr })}` : ''}`,
          status: interventionData.statut
        });
        
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
          .eq('intervention_id', id);
        
        if (!teamsError && teamsData) {
          const teams = teamsData.map(item => item.equipes);
          setIntervention(prev => ({
            ...prev!,
            teams: teams
          }));
          
          if (teams.length > 0) {
            history.push({
              date: interventionData.updated_at,
              type: 'team',
              text: `Équipe${teams.length > 1 ? 's' : ''} assignée${teams.length > 1 ? 's' : ''} : ${teams.map(t => t.nom).join(', ')}`,
              status: interventionData.statut
            });
          }
        }
        
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
          .eq('intervention_id', id);
        
        if (!equipmentError && equipmentData) {
          const equipment = equipmentData.map(item => item.materiels);
          setIntervention(prev => ({
            ...prev!,
            equipment: equipment
          }));
          
          if (equipment.length > 0) {
            history.push({
              date: interventionData.updated_at,
              type: 'equipment',
              text: `Équipement${equipment.length > 1 ? 's' : ''} assigné${equipment.length > 1 ? 's' : ''} : ${equipment.map(e => e.reference).join(', ')}`,
              status: interventionData.statut
            });
          }
        }
        
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
            .maybeSingle();
          
          if (!pvError && pvData) {
            setIntervention(prev => ({
              ...prev!,
              pv_interventions: pvData
            }));
            
            history.push({
              date: interventionData.updated_at,
              type: 'pv',
              text: `Procès-verbal créé`,
              status: interventionData.statut
            });
            
            if (pvData.validation_client !== null) {
              const validationStatus = pvData.validation_client ? 'pv_validated' : 'pv_rejected';
              const validationText = pvData.validation_client 
                ? 'Procès-verbal validé par le client' 
                : 'Procès-verbal refusé par le client';
              
              if (pvData.commentaire) {
                history.push({
                  date: pvData.date_validation,
                  type: validationStatus,
                  text: validationText + (pvData.commentaire ? ` avec commentaire` : ''),
                  status: interventionData.statut,
                  commentaire: pvData.commentaire
                });
              } else {
                history.push({
                  date: pvData.date_validation,
                  type: validationStatus,
                  text: validationText,
                  status: interventionData.statut
                });
              }
            }
          }
        }
        
        if (interventionData.statut === 'terminée') {
          history.push({
            date: interventionData.date_fin || interventionData.updated_at,
            type: 'completion',
            text: `Intervention terminée`,
            status: 'terminée'
          });
        }
        
        history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setHistory(history);
        
        const { data: teamsData2 } = await supabase
          .from('equipes')
          .select('*');
        if (teamsData2) {
          setAvailableTeams(teamsData2);
        }
        
        const { data: equipmentData2 } = await supabase
          .from('materiels')
          .select('*')
          .in('etat', ['disponible']);
        if (equipmentData2) {
          setAvailableEquipment(equipmentData2);
        }
        
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
      
      const { error: updateError } = await supabase
        .from('interventions')
        .update({ pv_intervention_id: pvData.id })
        .eq('id', intervention.id);
      
      if (updateError) throw updateError;
      
      toast({ title: "Succès", description: "Le PV a été créé avec succès." });
      
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
  
  const handleEditIntervention = () => {
    navigate(`/admin/interventions/new?edit=${id}`);
  };
  
  const handlePrintIntervention = () => {
    toast({
      title: "Impression",
      description: "Préparation du document PDF en cours...",
    });
    // Logique d'impression à implémenter
  };

  const handleAssignTeam = async () => {
    if (!intervention || !selectedTeam) return;
    
    setIsUpdating(true);
    
    try {
      if (intervention.teams && intervention.teams.length > 0) {
        await supabase
          .from('intervention_equipes')
          .delete()
          .eq('intervention_id', intervention.id);
      }
      
      const { error } = await supabase
        .from('intervention_equipes')
        .insert({
          intervention_id: intervention.id,
          equipe_id: selectedTeam
        });
      
      if (error) throw error;
      
      if (intervention.statut === 'en_attente' || intervention.statut === 'validée') {
        await supabase
          .from('interventions')
          .update({ statut: 'planifiée' })
          .eq('id', intervention.id);
      }
      
      toast({
        title: "Équipe assignée",
        description: "L'équipe a été assignée avec succès."
      });
      
      setIsTeamDialogOpen(false);
      window.location.reload();
      
    } catch (error) {
      console.error("Erreur lors de l'assignation de l'équipe:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'assigner l'équipe."
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleAssignEquipment = async () => {
    if (!intervention || selectedEquipment.length === 0) return;
    
    setIsUpdating(true);
    
    try {
      if (intervention.equipment && intervention.equipment.length > 0) {
        await supabase
          .from('intervention_materiels')
          .delete()
          .eq('intervention_id', intervention.id);
      }
      
      const insertData = selectedEquipment.map(equipId => ({
        intervention_id: intervention.id,
        materiel_id: equipId
      }));
      
      const { error } = await supabase
        .from('intervention_materiels')
        .insert(insertData);
      
      if (error) throw error;
      
      for (const equipId of selectedEquipment) {
        await supabase
          .from('materiels')
          .update({ etat: 'en utilisation' })
          .eq('id', equipId);
      }
      
      if (intervention.statut === 'en_attente' || intervention.statut === 'validée') {
        await supabase
          .from('interventions')
          .update({ statut: 'planifiée' })
          .eq('id', intervention.id);
      }
      
      toast({
        title: "Matériel assigné",
        description: "Le matériel a été assigné avec succès."
      });
      
      setIsEquipmentDialogOpen(false);
      window.location.reload();
      
    } catch (error) {
      console.error("Erreur lors de l'assignation du matériel:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'assigner le matériel."
      });
    } finally {
      setIsUpdating(false);
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

  if (!intervention) {
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

  const canModify = !intervention || intervention.statut !== 'terminée';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/admin/interventions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux interventions
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintIntervention}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          
          {canModify && (
            <Button onClick={handleEditIntervention}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
          
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
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold mb-3">Équipes assignées</h3>
                      {canModify && (
                        <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <User className="mr-2 h-4 w-4" />
                              Assigner une équipe
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assigner une équipe</DialogTitle>
                              <DialogDescription>
                                Sélectionnez l'équipe à assigner à cette intervention.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="team-select">Équipe</Label>
                              <Select onValueChange={setSelectedTeam} value={selectedTeam || undefined}>
                                <SelectTrigger id="team-select">
                                  <SelectValue placeholder="Sélectionner une équipe" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTeams.map((team) => (
                                    <SelectItem key={team.id} value={team.id}>
                                      {team.nom} {team.specialisation ? `(${team.specialisation})` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsTeamDialogOpen(false)}>
                                Annuler
                              </Button>
                              <Button onClick={handleAssignTeam} disabled={!selectedTeam || isUpdating}>
                                {isUpdating ? "Assignation..." : "Assigner l'équipe"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    
                    {intervention?.teams && intervention.teams.length > 0 ? (
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
                    
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold mb-3">Matériel utilisé</h3>
                      {canModify && (
                        <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Wrench className="mr-2 h-4 w-4" />
                              Assigner du matériel
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Assigner du matériel</DialogTitle>
                              <DialogDescription>
                                Sélectionnez le matériel à utiliser pour cette intervention.
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-72 mt-4">
                              <div className="space-y-4">
                                {availableEquipment.map((equip) => (
                                  <div key={equip.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`equip-${equip.id}`} 
                                      checked={selectedEquipment.includes(equip.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedEquipment([...selectedEquipment, equip.id]);
                                        } else {
                                          setSelectedEquipment(selectedEquipment.filter(id => id !== equip.id));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`equip-${equip.id}`} className="flex-1">
                                      <div className="font-medium">{equip.reference}</div>
                                      <div className="text-sm text-muted-foreground">{equip.type_materiel}</div>
                                    </Label>
                                  </div>
                                ))}
                                
                                {availableEquipment.length === 0 && (
                                  <div className="text-center py-4">
                                    <p className="text-muted-foreground">Aucun matériel disponible</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                            <DialogFooter className="mt-4">
                              <Button variant="outline" onClick={() => setIsEquipmentDialogOpen(false)}>
                                Annuler
                              </Button>
                              <Button 
                                onClick={handleAssignEquipment}
                                disabled={selectedEquipment.length === 0 || isUpdating}
                              >
                                {isUpdating ? "Assignation..." : "Assigner le matériel"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    
                    {intervention?.equipment && intervention.equipment.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {intervention.equipment.map((item) => (
                          <Card key={item.id} className="bg-muted/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{item.reference}</CardTitle>
                              <CardDescription>Type: {item.type_materiel}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Badge variant={item.etat === "disponible" ? "default" : 
                                item.etat === "en utilisation" ? "outline" : "destructive"}>
                                {item.etat}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
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
                      {history.map((item: HistoryItem, index) => (
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
                            {item.commentaire && (
                              <div className="mt-2 bg-background p-2 rounded border">
                                <p className="text-sm text-muted-foreground">"{item.commentaire}"</p>
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
              {canModify && (
                <>
                  {!intervention?.teams?.length && (
                    <Button 
                      className="w-full" 
                      onClick={() => setIsTeamDialogOpen(true)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Assigner une équipe
                    </Button>
                  )}
                  
                  {intervention && !intervention.equipment?.length && (
                    <Button 
                      className="w-full" 
                      onClick={() => setIsEquipmentDialogOpen(true)}
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Assigner du matériel
                    </Button>
                  )}
                  
                  {intervention && intervention.teams?.length && intervention.equipment?.length && (
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={async () => {
                        try {
                          if (!intervention) return;
                          
                          await supabase
                            .from('interventions')
                            .update({ statut: 'planifiée' })
                            .eq('id', intervention.id);
                            
                          toast({
                            title: "Succès",
                            description: "L'intervention est maintenant planifiée."
                          });
                          
                          window.location.reload();
                        } catch (error) {
                          console.error(error);
                          toast({
                            variant: "destructive",
                            title: "Erreur",
                            description: "Impossible de mettre à jour le statut de l'intervention."
                          });
                        }
                      }}
                      disabled={intervention.statut === 'planifiée' || intervention.statut === 'en_cours' || intervention.statut === 'terminée'}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirmer planification
                    </Button>
                  )}
                </>
              )}
              
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
              
              {intervention && (intervention.statut === 'planifiée' || intervention.statut === 'en_cours') && (
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={async () => {
                    try {
                      await supabase
                        .from('interventions')
                        .update({
                          statut: 'terminée',
                          date_fin: new Date().toISOString()
                        })
                        .eq('id', intervention.id);
                        
                      toast({
                        title: "Succès",
                        description: "L'intervention a été marquée comme terminée."
                      });
                      
                      window.location.reload();
                    } catch (error) {
                      console.error(error);
                      toast({
                        variant: "destructive",
                        title: "Erreur",
                        description: "Impossible de terminer l'intervention."
                      });
                    }
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marquer comme terminée
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
                onClick={handlePrintIntervention}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimer le récapitulatif
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
