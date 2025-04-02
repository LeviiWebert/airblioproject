
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ArrowLeft, 
  Calendar, 
  Check, 
  Clock, 
  Download, 
  FileText, 
  Info, 
  MapPin, 
  MessageSquare, 
  Printer, 
  User, 
  X 
} from "lucide-react";

const InterventionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [intervention, setIntervention] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInterventionDetails = async () => {
      try {
        if (!id) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        // Récupérer les détails complets de la demande d'intervention
        const { data, error } = await supabase
          .from('demande_interventions')
          .select(`
            id,
            description,
            date_demande,
            urgence,
            statut,
            intervention_id,
            client_id,
            interventions:intervention_id (
              id,
              date_debut,
              date_fin,
              rapport,
              statut,
              localisation,
              pv_intervention_id,
              intervention_equipes:intervention_equipes (
                equipe_id,
                equipes:equipes (
                  id,
                  nom,
                  specialisation
                )
              ),
              pv_interventions:pv_intervention_id (
                id,
                validation_client,
                date_validation,
                commentaire
              )
            )
          `)
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        // Vérifier que l'utilisateur est bien le propriétaire de la demande
        if (data.client_id !== user.id) {
          navigate('/client-dashboard');
          toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Vous n'êtes pas autorisé à consulter cette intervention."
          });
          return;
        }
        
        setIntervention(data);
        
        if (data.interventions?.pv_interventions?.commentaire) {
          setFeedback(data.interventions.pv_interventions.commentaire);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'intervention:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les détails de l'intervention."
        });
        navigate('/client-dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchInterventionDetails();
  }, [id, navigate, toast]);

  const handleValidateIntervention = async (validate: boolean) => {
    try {
      setSubmitting(true);
      
      if (!intervention?.interventions?.pv_intervention_id) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Aucun PV d'intervention à valider."
        });
        return;
      }
      
      // Mettre à jour le PV d'intervention
      const { error } = await supabase
        .from('pv_interventions')
        .update({
          validation_client: validate,
          date_validation: new Date().toISOString(),
          commentaire: feedback
        })
        .eq('id', intervention.interventions.pv_intervention_id);
        
      if (error) throw error;
      
      // Recharger les données
      const { data: updatedData, error: fetchError } = await supabase
        .from('demande_interventions')
        .select(`
          id,
          description,
          date_demande,
          urgence,
          statut,
          intervention_id,
          client_id,
          interventions:intervention_id (
            id,
            date_debut,
            date_fin,
            rapport,
            statut,
            localisation,
            pv_intervention_id,
            pv_interventions:pv_intervention_id (
              id,
              validation_client,
              date_validation,
              commentaire
            )
          )
        `)
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      setIntervention(updatedData);
      
      toast({
        title: validate ? "Intervention validée" : "Intervention rejetée",
        description: validate 
          ? "Merci pour votre validation de l'intervention." 
          : "Votre retour a été enregistré."
      });
    } catch (error) {
      console.error("Erreur lors de la validation de l'intervention:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de valider l'intervention."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Normalement, cette fonction téléchargerait un PDF généré côté serveur
    toast({
      title: "Téléchargement du PDF",
      description: "Le récapitulatif de l'intervention a été téléchargé."
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non définie";
    return format(new Date(dateString), "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (!intervention) {
    return (
      <ClientLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Intervention non trouvée</h2>
              <p className="text-muted-foreground mb-4">
                Désolé, l'intervention que vous recherchez n'existe pas ou a été supprimée.
              </p>
              <Button onClick={() => navigate('/client-dashboard')}>
                Retour au tableau de bord
              </Button>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="print:hidden mb-8">
          <Button variant="outline" onClick={() => navigate('/client-dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card id="intervention-details" className="print:shadow-none">
              <CardHeader className="print:pb-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>
                      Récapitulatif d'intervention #{intervention.id.substring(0, 8).toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      Demande du {format(new Date(intervention.date_demande), "dd MMMM yyyy", { locale: fr })}
                    </CardDescription>
                  </div>
                  <div className="mt-4 md:mt-0 print:hidden">
                    <Button variant="outline" size="sm" className="mr-2" onClick={handlePrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimer
                    </Button>
                    <Button size="sm" onClick={handleDownloadPdf}>
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Statut de la demande</h3>
                  <div className="flex flex-wrap gap-2">
                    <InterventionStatusBadge status={intervention.statut} className="text-base" />
                    <PriorityBadge priority={intervention.urgence} className="text-base" />
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description de la demande</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p>{intervention.description}</p>
                  </div>
                </div>
                
                {intervention.intervention_id && (
                  <>
                    <Separator className="my-6" />
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Détails de l'intervention</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start">
                          <Clock className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Date de début</p>
                            <p className="text-muted-foreground">
                              {formatDate(intervention.interventions.date_debut)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Calendar className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Date de fin</p>
                            <p className="text-muted-foreground">
                              {formatDate(intervention.interventions.date_fin)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Localisation</p>
                            <p className="text-muted-foreground">
                              {intervention.interventions.localisation || "Non spécifiée"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <FileText className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Statut de l'intervention</p>
                            <div className="mt-1">
                              <InterventionStatusBadge status={intervention.interventions.statut} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {intervention.interventions.rapport && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-2">Rapport d'intervention</h4>
                          <div className="bg-muted p-4 rounded-md">
                            <p className="whitespace-pre-line">{intervention.interventions.rapport}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Informations d'équipe */}
                      {intervention.interventions.intervention_equipes && 
                       intervention.interventions.intervention_equipes.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-2">Équipe(s) technique(s)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {intervention.interventions.intervention_equipes.map((item: any) => (
                              <div key={item.equipe_id} className="flex items-center border rounded-md p-3">
                                <User className="w-8 h-8 text-primary mr-3" />
                                <div>
                                  <p className="font-medium">{item.equipes?.nom}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.equipes?.specialisation || "Équipe technique"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {intervention.intervention_id && 
             intervention.interventions.statut === "terminée" && (
              <Card className="print:hidden">
                <CardHeader>
                  <CardTitle>Validation de l'intervention</CardTitle>
                  <CardDescription>
                    Veuillez valider l'intervention et apporter vos commentaires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm mb-2">Votre retour sur l'intervention:</p>
                      <Textarea 
                        placeholder="Commentaires ou observations sur l'intervention..." 
                        className="min-h-[120px]"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        disabled={intervention.interventions.pv_interventions?.validation_client !== null}
                      />
                    </div>
                    
                    {intervention.interventions.pv_interventions?.validation_client === null ? (
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button 
                          onClick={() => handleValidateIntervention(true)} 
                          disabled={submitting}
                          className="flex-1"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Valider l'intervention
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleValidateIntervention(false)} 
                          disabled={submitting}
                          className="flex-1"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Signaler un problème
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div className="flex items-center">
                          {intervention.interventions.pv_interventions?.validation_client ? (
                            <Check className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <div>
                            <p className="font-medium">
                              {intervention.interventions.pv_interventions?.validation_client 
                                ? "Intervention validée" 
                                : "Problème signalé"
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Le {format(
                                new Date(intervention.interventions.pv_interventions?.date_validation),
                                "dd/MM/yyyy à HH:mm",
                                { locale: fr }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Numéro d'intervention</p>
                  <p className="text-lg">#{intervention.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Date de la demande</p>
                  <p>{format(new Date(intervention.date_demande), "dd/MM/yyyy", { locale: fr })}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Niveau d'urgence</p>
                  <div className="mt-1">
                    <PriorityBadge priority={intervention.urgence} />
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Statut actuel</p>
                  <div className="mt-1">
                    {intervention.intervention_id ? (
                      <InterventionStatusBadge status={intervention.interventions.statut} />
                    ) : (
                      <InterventionStatusBadge status={intervention.statut} />
                    )}
                  </div>
                </div>
                {intervention.intervention_id && intervention.interventions.date_debut && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium">Date programmée</p>
                      <p>{format(new Date(intervention.interventions.date_debut), "dd/MM/yyyy", { locale: fr })}</p>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:support@gestint.com?subject=Question sur l'intervention #${intervention.id.substring(0, 8).toUpperCase()}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contacter le support
                  </a>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="print:hidden">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer
                </Button>
                <Button variant="outline" className="w-full" onClick={handleDownloadPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default InterventionDetails;
