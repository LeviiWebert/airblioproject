import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { demandeInterventionService } from "@/services/supabaseService/demandeInterventionService";
import { 
  AlertTriangle,
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
  Users, 
  X,
  Wrench,
  Package
} from "lucide-react";
import { SmallLoading } from "@/components/ui/loading";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { InterventionMainCard } from "./components/InterventionMainCard";
import { InterventionTeamsAndEquipment } from "./components/InterventionTeamsAndEquipment";
import { InterventionValidationCard } from "./components/InterventionValidationCard";
import { InterventionRecapSidebar } from "./components/InterventionRecapSidebar";

interface Intervention {
  id: string;
  date_debut: string | null;
  date_fin: string | null;
  rapport: string | null;
  statut: string;
  localisation: string;
  pv_intervention_id: string | null;
  pv_interventions?: PVIntervention;
  intervention_equipes?: InterventionEquipe[];
  intervention_materiels?: InterventionMateriel[];
}

interface InterventionMateriel {
  materiel_id: string;
  materiels: {
    id: string;
    reference: string;
    type_materiel: string;
    etat: string | null;
  };
}

interface PVIntervention {
  id: string;
  validation_client: boolean | null;
  date_validation: string | null;
  commentaire: string | null;
}

interface InterventionEquipe {
  equipe_id: string;
  equipes: {
    id: string;
    nom: string;
    specialisation: string | null;
  };
}

interface DemandeIntervention {
  id: string;
  description: string;
  date_demande: string;
  urgence: string;
  statut: string;
  intervention_id: string | null;
  client_id: string;
  intervention?: Intervention; // Optional related intervention
}

const InterventionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const [demande, setDemande] = useState<DemandeIntervention | null>(null);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingDemande, setCancellingDemande] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [materiels, setMateriels] = useState<InterventionMateriel[]>([]);
  const { user, clientId } = useAuth();

  useEffect(() => {
    const fetchInterventionDetails = async () => {
      try {
        if (!id) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        if (!clientId) {
          console.error("Client ID not found in auth context");
          uiToast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Profil client non trouvé. Veuillez vous reconnecter."
          });
          navigate('/auth');
          return;
        }
        
        setAuthChecked(true);

        const { data: demandeData, error: demandeError } = await supabase
          .from('demande_interventions')
          .select(`
            id,
            description,
            date_demande,
            urgence,
            statut,
            intervention_id,
            client_id
          `)
          .eq('id', id)
          .single();
          
        if (demandeError) {
          console.error("Erreur lors du chargement de la demande:", demandeError);
          throw demandeError;
        }
        
        if (demandeData.client_id !== clientId) {
          console.error(`Demande appartient au client ${demandeData.client_id}, mais l'utilisateur connecté est ${clientId}`);
          uiToast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Vous n'êtes pas autorisé à consulter cette intervention."
          });
          navigate('/client/interventions');
          return;
        }
        
        setDemande(demandeData);
        
        if (demandeData.intervention_id) {
          const { data: interventionData, error: interventionError } = await supabase
            .from('interventions')
            .select(`
              id,
              date_debut,
              date_fin,
              rapport,
              statut,
              localisation,
              pv_intervention_id
            `)
            .eq('id', demandeData.intervention_id)
            .single();
          
          if (interventionError) throw interventionError;
          
          setIntervention(interventionData);
          
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
              
              if (pvData.commentaire) {
                setFeedback(pvData.commentaire);
              }
            }
          }
          
          const { data: equipesData, error: equipesError } = await supabase
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
          
          if (!equipesError && equipesData) {
            setIntervention(prev => ({
              ...prev!,
              intervention_equipes: equipesData
            }));
          }
          
          const { data: materielsData, error: materielsError } = await supabase
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
          
          if (!materielsError && materielsData) {
            setMateriels(materielsData);
            setIntervention(prev => ({
              ...prev!,
              intervention_materiels: materielsData
            }));
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'intervention:", error);
        uiToast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les détails de l'intervention."
        });
        navigate('/client/interventions');
      } finally {
        setLoading(false);
      }
    };

    fetchInterventionDetails();
  }, [id, navigate, uiToast, clientId]);

  const handleValidateIntervention = async (validate: boolean) => {
    try {
      setSubmitting(true);
      
      if (!intervention?.pv_intervention_id) {
        uiToast({
          variant: "destructive",
          title: "Erreur",
          description: "Aucun PV d'intervention à valider."
        });
        return;
      }
      
      const { error } = await supabase
        .from('pv_interventions')
        .update({
          validation_client: validate,
          date_validation: new Date().toISOString(),
          commentaire: feedback
        })
        .eq('id', intervention.pv_intervention_id);
        
      if (error) throw error;
      
      const fetchInterventionDetails = async () => {
        try {
          if (!id) return;
          
          const { data: demandeData } = await supabase
            .from('demande_interventions')
            .select(`
              id,
              description,
              date_demande,
              urgence,
              statut,
              intervention_id,
              client_id
            `)
            .eq('id', id)
            .single();
          
          setDemande(demandeData);
          
          if (demandeData?.intervention_id) {
            const { data: interventionData } = await supabase
              .from('interventions')
              .select(`
                id,
                date_debut,
                date_fin,
                rapport,
                statut,
                localisation,
                pv_intervention_id
              `)
              .eq('id', demandeData.intervention_id)
              .single();
            
            setIntervention(interventionData);
            
            if (interventionData?.pv_intervention_id) {
              const { data: pvData } = await supabase
                .from('pv_interventions')
                .select(`
                  id,
                  validation_client,
                  date_validation,
                  commentaire
                `)
                .eq('id', interventionData.pv_intervention_id)
                .single();
              
              if (pvData) {
                setIntervention(prev => ({
                  ...prev!,
                  pv_interventions: pvData
                }));
                
                if (pvData.commentaire) {
                  setFeedback(pvData.commentaire);
                }
              }
            }
            
            const { data: equipesData } = await supabase
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
            
            if (equipesData) {
              setIntervention(prev => ({
                ...prev!,
                intervention_equipes: equipesData
              }));
            }
          }
        } catch (error) {
          console.error("Erreur lors du rechargement des données:", error);
        }
      };
      
      await fetchInterventionDetails();
      
      uiToast({
        title: validate ? "Intervention validée" : "Intervention rejetée",
        description: validate 
          ? "Merci pour votre validation de l'intervention." 
          : "Votre retour a été enregistré."
      });
    } catch (error) {
      console.error("Erreur lors de la validation de l'intervention:", error);
      uiToast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de valider l'intervention."
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancelDemande = async () => {
    if (!demande) return;
    
    try {
      setCancellingDemande(true);
      
      const { error } = await supabase
        .from('demande_interventions')
        .update({ statut: 'annulée' })
        .eq('id', demande.id);
        
      if (error) throw error;
      
      setDemande(prev => {
        if (!prev) return null;
        return {
          ...prev,
          statut: 'annulée'
        };
      });
      
      toast("Votre demande d'intervention a été annulée");
      
    } catch (error) {
      console.error("Erreur lors de l'annulation de la demande:", error);
      toast("Impossible d'annuler la demande d'intervention");
    } finally {
      setCancellingDemande(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    uiToast({
      title: "Téléchargement du PDF",
      description: "Le récapitulatif de l'intervention a été téléchargé."
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non définie";
    return format(new Date(dateString), "dd MMMM yyyy à HH:mm", { locale: fr });
  };
  
  const canCancelDemande = () => {
    if (!demande) return false;
    
    const cancelableStatuses = ["en_attente", "en_cours_analyse", "validée"];
    return cancelableStatuses.includes(demande.statut);
  };

  const renderCancelButton = () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <X className="mr-2 h-4 w-4" />
          Annuler ma demande d'intervention
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler la demande d'intervention</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir annuler cette demande d'intervention ?
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Retour</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancelDemande}
            disabled={cancellingDemande}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cancellingDemande ? 'Annulation...' : 'Confirmer l\'annulation'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SmallLoading />
      </div>
    );
  }

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
            <Button onClick={() => navigate('/client/interventions')}>
              Retour à la liste des interventions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="print:hidden mb-8">
        <Button variant="outline" onClick={() => navigate('/client/interventions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste des interventions
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <InterventionMainCard
            demande={demande}
            intervention={intervention}
            formatDate={formatDate}
            onPrint={handlePrint}
            onDownloadPdf={handleDownloadPdf}
            canCancel={canCancelDemande()}
            renderCancelButton={renderCancelButton}
          >
            {intervention && (
              <InterventionTeamsAndEquipment intervention={intervention} materiels={materiels} />
            )}
          </InterventionMainCard>
          <InterventionValidationCard
            intervention={intervention}
            feedback={feedback}
            setFeedback={setFeedback}
            submitting={submitting}
            handleValidate={handleValidateIntervention}
          />
        </div>
        <div className="space-y-6">
          <InterventionRecapSidebar
            demande={demande}
            intervention={intervention}
            handlePrint={handlePrint}
            handleDownloadPdf={handleDownloadPdf}
            navigate={navigate}
          />
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
              <Button variant="outline" className="w-full" onClick={() => navigate('/client/pvs')}>
                <FileText className="mr-2 h-4 w-4" />
                Voir tous mes PVs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterventionDetails;
