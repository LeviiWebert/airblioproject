import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Check, 
  X, 
  Download,
  FileText,
  Printer,
  MessageSquare,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SmallLoading } from "@/components/ui/loading";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Intervention {
  id: string;
  date_debut: string | null;
  date_fin: string | null;
  rapport: string | null;
  statut: string;
  localisation: string;
}

interface PVIntervention {
  id: string;
  validation_client: boolean | null;
  date_validation: string | null;
  commentaire: string | null;
  intervention_id: string;
  client_id: string;
  intervention?: Intervention;
}

const ProcessVerbalClient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clientId } = useAuth();
  const [pv, setPv] = useState<PVIntervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPVDetails = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        
        const { data: pvData, error: pvError } = await supabase
          .from('pv_interventions')
          .select(`
            id,
            validation_client,
            date_validation,
            commentaire,
            intervention_id,
            client_id
          `)
          .eq('id', id)
          .single();
        
        if (pvError) throw pvError;
        
        if (pvData.client_id !== clientId) {
          navigate('/client-dashboard');
          toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Vous n'êtes pas autorisé à consulter ce PV d'intervention."
          });
          return;
        }
        
        if (pvData.intervention_id) {
          const { data: interventionData, error: interventionError } = await supabase
            .from('interventions')
            .select(`
              id,
              date_debut,
              date_fin,
              rapport,
              statut,
              localisation
            `)
            .eq('id', pvData.intervention_id)
            .single();
          
          if (!interventionError && interventionData) {
            setPv({
              ...pvData,
              intervention: interventionData
            });
          } else {
            setPv(pvData);
          }
        } else {
          setPv(pvData);
        }
        
        if (pvData.commentaire) {
          setFeedback(pvData.commentaire);
        }
        
      } catch (error) {
        console.error("Erreur lors du chargement du PV:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les détails du PV."
        });
        navigate('/client-dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchPVDetails();
  }, [id, navigate, toast, clientId]);

  const handleValidatePV = async (validate: boolean) => {
    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('pv_interventions')
        .update({
          validation_client: validate,
          date_validation: new Date().toISOString(),
          commentaire: feedback
        })
        .eq('id', id);
        
      if (error) throw error;
      
      const { data: pvData } = await supabase
        .from('pv_interventions')
        .select(`
          id,
          validation_client,
          date_validation,
          commentaire,
          intervention_id,
          client_id
        `)
        .eq('id', id)
        .single();
        
      if (pvData) {
        setPv(prev => ({
          ...prev!,
          validation_client: pvData.validation_client,
          date_validation: pvData.date_validation,
          commentaire: pvData.commentaire
        }));
      }
      
      toast({
        title: validate ? "PV validé" : "PV refusé",
        description: validate 
          ? "Merci pour votre validation du PV d'intervention." 
          : "Votre retour a été enregistré."
      });
      
    } catch (error) {
      console.error("Erreur lors de la validation du PV:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de valider le PV d'intervention."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    toast({
      title: "Téléchargement du PDF",
      description: "Le PV d'intervention a été téléchargé."
    });
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

  if (!pv) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">PV non trouvé</h2>
            <p className="text-muted-foreground mb-4">
              Désolé, le PV que vous recherchez n'existe pas ou a été supprimé.
            </p>
            <Button onClick={() => navigate('/client-dashboard')}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(`/client/intervention/${pv.intervention_id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'intervention
        </Button>
        
        <div className="space-x-2 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="print:shadow-none">
            <CardHeader className="print:pb-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>
                    Procès-Verbal d'Intervention
                  </CardTitle>
                  <CardDescription>
                    {pv.intervention?.date_fin 
                      ? `Intervention du ${formatDate(pv.intervention?.date_fin)}` 
                      : "Date d'intervention non spécifiée"}
                  </CardDescription>
                </div>
                <div className="mt-4 md:mt-0 print:hidden">
                  {pv.validation_client === null ? (
                    <Badge variant="outline">En attente de validation</Badge>
                  ) : pv.validation_client ? (
                    <Badge variant="default" className="bg-green-500">Validé</Badge>
                  ) : (
                    <Badge variant="destructive">Refusé</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Détails de l'intervention</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Date de l'intervention</p>
                      <p className="text-muted-foreground">
                        {formatDate(pv.intervention?.date_fin)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FileText className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Localisation</p>
                      <p className="text-muted-foreground">
                        {pv.intervention?.localisation || "Non spécifiée"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {pv.intervention?.rapport && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Rapport d'intervention</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="whitespace-pre-line">{pv.intervention.rapport}</p>
                  </div>
                </div>
              )}
              
              <Separator className="my-6" />
              
              {pv.validation_client !== null ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Votre validation</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-center mb-3">
                      {pv.validation_client ? (
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <p>
                        <span className="font-medium">
                          {pv.validation_client 
                            ? "Vous avez validé ce PV" 
                            : "Vous avez refusé ce PV"}
                        </span> le {formatDate(pv.date_validation)}
                      </p>
                    </div>
                    
                    {pv.commentaire && (
                      <div className="bg-background p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Votre commentaire:</p>
                        <p className="text-muted-foreground">"{pv.commentaire}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-6 print:hidden">
                  <h3 className="text-lg font-semibold mb-2">Validation du PV</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm mb-2">Votre commentaire (optionnel):</p>
                      <Textarea 
                        placeholder="Commentaires ou observations sur l'intervention..." 
                        className="min-h-[120px]"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button 
                        onClick={() => handleValidatePV(true)} 
                        disabled={submitting}
                        className="flex-1"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Valider le PV
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleValidatePV(false)} 
                        disabled={submitting}
                        className="flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Refuser le PV
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 print:hidden">
          <Card>
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
              <Button 
                variant="outline" 
                className="w-full" 
                asChild
              >
                <a href="mailto:support@gestint.com?subject=Question%20sur%20le%20PV%20d%27intervention">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contacter le support
                </a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Statut du PV</CardTitle>
            </CardHeader>
            <CardContent>
              {pv.validation_client === null ? (
                <div className="text-center p-2">
                  <Badge variant="outline" className="mb-2">En attente</Badge>
                  <p className="text-sm text-muted-foreground">
                    Veuillez valider ou refuser ce PV d'intervention.
                  </p>
                </div>
              ) : pv.validation_client ? (
                <div className="text-center p-2">
                  <Badge variant="default" className="bg-green-500 mb-2">Validé</Badge>
                  <p className="text-sm text-muted-foreground">
                    Vous avez validé ce PV le {format(new Date(pv.date_validation || ''), "dd/MM/yyyy", { locale: fr })}.
                  </p>
                </div>
              ) : (
                <div className="text-center p-2">
                  <Badge variant="destructive" className="mb-2">Refusé</Badge>
                  <p className="text-sm text-muted-foreground">
                    Vous avez refusé ce PV le {format(new Date(pv.date_validation || ''), "dd/MM/yyyy", { locale: fr })}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProcessVerbalClient;
