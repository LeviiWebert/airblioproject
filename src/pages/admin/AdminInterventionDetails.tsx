import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Users, Wrench, MapPin, Truck, FileText, Clipboard, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { interventionService } from "@/services/dataService";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { useToast } from "@/hooks/use-toast";
import AssignEquipmentDialog from "@/components/dialogs/AssignEquipmentDialog";
import ManageTeamsDialog from "@/components/dialogs/ManageTeamsDialog";
import { EditPvDialog } from "@/components/dialogs/EditPvDialog";

const AdminInterventionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [intervention, setIntervention] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignEquipmentDialogOpen, setIsAssignEquipmentDialogOpen] = useState(false);
  const [isManageTeamsDialogOpen, setIsManageTeamsDialogOpen] = useState(false);
  const [editPvOpen, setEditPvOpen] = useState(false);

  const fetchInterventionDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await interventionService.getById(id);
      setIntervention(data);
      console.log("Intervention details:", data);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des détails de l'intervention:", error);
      setError("Impossible de charger les détails de l'intervention.");
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les détails de l'intervention.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventionDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    
    try {
      await interventionService.updateStatus(id, newStatus);
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut de l'intervention a été mis à jour avec succès.`,
      });
      
      fetchInterventionDetails();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de l'intervention.",
      });
    }
  };

  const handleEquipmentAssigned = () => {
    toast({
      title: "Matériel assigné",
      description: "Le matériel a été assigné avec succès à l'intervention.",
    });
    fetchInterventionDetails();
  };

  const handleTeamsUpdated = () => {
    toast({
      title: "Équipes mises à jour",
      description: "Les équipes ont été mises à jour avec succès.",
    });
    fetchInterventionDetails();
  };

  const handleEditPv = () => {
    if (intervention?.demande?.client_id) {
      console.log("Using client ID for PV:", intervention.demande.client_id);
      setEditPvOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'éditer le PV : ID client manquant"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Chargement des détails de l'intervention...</p>
        </div>
      </div>
    );
  }

  if (error || !intervention) {
    return (
      <div className="rounded-md border p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
        <p className="text-muted-foreground mb-4">{error || "Intervention non trouvée"}</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Non définie";
    return format(new Date(date), "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Détails de l'intervention</h1>
            <p className="text-muted-foreground">
              Référence: {intervention.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAssignEquipmentDialogOpen(true)}
          >
            <Wrench className="mr-2 h-4 w-4" />
            Assigner du matériel
          </Button>
          
          <Button
            onClick={() => navigate(`/admin/interventions/new?interventionId=${intervention.id}`)}
          >
            Modifier
          </Button>
          
          <Button variant="outline" onClick={handleEditPv}>
            <span>Éditer le PV</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clipboard className="mr-2 h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Statut</h3>
                  <div className="mt-1">
                    <InterventionStatusBadge status={intervention.statut} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                  <p className="mt-1">{intervention.demande?.client?.nom_entreprise || "Non assigné"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date de début</h3>
                  <p className="mt-1">{formatDate(intervention.date_debut)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date de fin</h3>
                  <p className="mt-1">{formatDate(intervention.date_fin)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Niveau d'urgence</h3>
                  <div className="mt-1">
                    <PriorityBadge priority={intervention.demande?.urgence || "moyenne"} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    <span className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" /> Localisation
                    </span>
                  </h3>
                  <p className="mt-1">{intervention.localisation || "Non définie"}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description de la demande</h3>
                <p className="mt-1 text-sm whitespace-pre-line">
                  {intervention.demande?.description || "Aucune description disponible"}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="teams">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="teams">Équipes</TabsTrigger>
              <TabsTrigger value="equipment">Matériel</TabsTrigger>
              <TabsTrigger value="report">Rapport</TabsTrigger>
            </TabsList>
            
            <TabsContent value="teams" className="space-y-4 pt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Équipes assignées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {intervention.teams && intervention.teams.length > 0 ? (
                    <div className="space-y-4">
                      {intervention.teams.map((team: any, index: number) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{team.nom}</h4>
                              {team.specialisation && (
                                <Badge variant="outline" className="mt-1">{team.specialisation}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune équipe assignée à cette intervention</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setIsManageTeamsDialogOpen(true)}>
                    Gérer les équipes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="equipment" className="space-y-4 pt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Wrench className="mr-2 h-5 w-5" />
                    Matériel utilisé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {intervention.equipment && intervention.equipment.length > 0 ? (
                    <div className="space-y-4">
                      {intervention.equipment.map((item: any, index: number) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{item.reference}</h4>
                              <p className="text-sm text-gray-500">{item.type_materiel}</p>
                            </div>
                            <Badge variant="outline">{item.etat}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun matériel assigné à cette intervention</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsAssignEquipmentDialogOpen(true)}
                  >
                    Assigner du matériel
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="report" className="space-y-4 pt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Rapport d'intervention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {intervention.rapport ? (
                    <div className="whitespace-pre-line">
                      {intervention.rapport}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun rapport disponible</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/admin/pv/${intervention.id}`)}>
                    Éditer le PV d'intervention
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Changer le statut</h3>
                
                {intervention.statut === "en_attente" && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusChange("validée")}
                  >
                    Valider la demande
                  </Button>
                )}
                
                {(intervention.statut === "validée" || intervention.statut === "en_attente") && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusChange("planifiée")}
                  >
                    Planifier l'intervention
                  </Button>
                )}
                
                {intervention.statut === "planifiée" && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusChange("en_cours")}
                  >
                    Démarrer l'intervention
                  </Button>
                )}
                
                {intervention.statut === "en_cours" && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusChange("terminée")}
                  >
                    Terminer l'intervention
                  </Button>
                )}
                
                {(intervention.statut !== "terminée" && intervention.statut !== "annulée") && (
                  <Button 
                    variant="destructive" 
                    className="w-full mt-2" 
                    onClick={() => handleStatusChange("annulée")}
                  >
                    Annuler l'intervention
                  </Button>
                )}
              </div>
              
              <Separator />
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsAssignEquipmentDialogOpen(true)}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Assigner du matériel
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsManageTeamsDialogOpen(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                Gérer les équipes
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/admin/pv/${intervention.id}`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Éditer le PV
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Logistique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Équipement assigné</h3>
                  <p className="mt-1">{intervention.equipment?.length || 0} élément(s)</p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsAssignEquipmentDialogOpen(true)}
                >
                  Gérer l'équipement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AssignEquipmentDialog
        open={isAssignEquipmentDialogOpen}
        onOpenChange={setIsAssignEquipmentDialogOpen}
        interventionId={intervention.id}
        onEquipmentAssigned={handleEquipmentAssigned}
      />

      <ManageTeamsDialog
        open={isManageTeamsDialogOpen}
        onOpenChange={setIsManageTeamsDialogOpen}
        interventionId={intervention.id}
        currentTeams={intervention.teams || []}
        onTeamsUpdated={handleTeamsUpdated}
      />

      <EditPvDialog
        open={editPvOpen}
        onOpenChange={setEditPvOpen}
        interventionId={intervention.id}
        clientId={intervention.demande?.client_id ?? ""}
        initialPvId={intervention.pv_intervention_id || undefined}
        onSaved={() => {
          fetchInterventionDetails();
          toast({
            title: "PV enregistré",
            description: "Le PV a été enregistré avec succès."
          });
        }}
      />
    </div>
  );
};

export default AdminInterventionDetails;
