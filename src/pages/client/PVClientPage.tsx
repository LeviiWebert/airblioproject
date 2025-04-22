
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Check, 
  X, 
  Clock, 
  FileText, 
  Calendar,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { pvInterventionService } from "@/services/dataService";

const PVClientPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { clientId } = useAuth();
  const [pv, setPv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPVDetails = async () => {
      try {
        if (!id) return;
        
        const pvData = await pvInterventionService.getPVById(id);
        
        if (!pvData) {
          navigate('/client/pvs');
          toast.error("PV non trouvé");
          return;
        }
        
        if (pvData.client_id !== clientId) {
          navigate('/client/pvs');
          toast.error("Accès non autorisé à ce PV");
          return;
        }
        
        setPv(pvData);
        setFeedback(pvData.commentaire || "");
      } catch (error) {
        console.error("Erreur lors du chargement du PV:", error);
        toast.error("Impossible de charger les détails du PV");
        navigate('/client/pvs');
      } finally {
        setLoading(false);
      }
    };

    fetchPVDetails();
  }, [id, navigate, clientId]);

  const handleValidatePV = async (validate: boolean) => {
    try {
      setSubmitting(true);
      
      await pvInterventionService.updatePVStatus(id!, validate, feedback);
      
      setPv(prev => ({
        ...prev,
        validation_client: validate,
        date_validation: new Date().toISOString(),
        commentaire: feedback
      }));
      
      toast.success(validate 
        ? "PV validé avec succès" 
        : "PV marqué comme refusé"
      );
    } catch (error) {
      console.error("Erreur lors de la validation du PV:", error);
      toast.error("Impossible de mettre à jour le PV");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!pv) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non définie";
    return format(new Date(dateString), "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        onClick={() => navigate('/client/pvs')} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la liste des PVs
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Procès-Verbal d'Intervention</CardTitle>
          {pv.validation_client === null && (
            <Badge variant="outline">En attente</Badge>
          )}
          {pv.validation_client === true && (
            <Badge variant="default" className="bg-green-500">Validé</Badge>
          )}
          {pv.validation_client === false && (
            <Badge variant="destructive">Refusé</Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>
                Intervention du {formatDate(pv.intervention?.date_fin)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span>
                Localisation: {pv.intervention?.localisation || "Non spécifiée"}
              </span>
            </div>

            {pv.intervention?.rapport && (
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Rapport d'intervention</h3>
                <p>{pv.intervention.rapport}</p>
              </div>
            )}

            {pv.validation_client === null && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Commentaire (optionnel)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[120px]"
                />
                
                <div className="flex gap-4">
                  <Button 
                    onClick={() => handleValidatePV(true)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Valider le PV
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleValidatePV(false)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Refuser le PV
                  </Button>
                </div>
              </div>
            )}

            {pv.validation_client !== null && (
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  {pv.validation_client ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-semibold">
                    {pv.validation_client ? "PV Validé" : "PV Refusé"}
                  </span>
                </div>
                <p>Le {formatDate(pv.date_validation)}</p>
                {pv.commentaire && (
                  <div className="mt-2">
                    <h4 className="font-medium">Votre commentaire :</h4>
                    <p className="text-muted-foreground">{pv.commentaire}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PVClientPage;
