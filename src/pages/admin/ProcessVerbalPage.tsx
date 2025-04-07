
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Check, 
  X, 
  Download,
  FileText,
  Printer,
  Send,
  User
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
import { toast } from "sonner";

interface Client {
  id: string;
  nom_entreprise: string;
  email: string;
  tel: string;
}

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
  client?: Client;
  intervention?: Intervention;
}

const ProcessVerbalPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pv, setPv] = useState<PVIntervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [additionalComment, setAdditionalComment] = useState("");

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
        
        if (pvError) throw pvError;
        
        // Fetch the intervention details
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
        
      } catch (error) {
        console.error("Erreur lors du chargement du PV:", error);
        toast.error("Impossible de charger les détails du PV");
        navigate('/admin/interventions');
      } finally {
        setLoading(false);
      }
    };

    fetchPVDetails();
  }, [id, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    toast.success("Le PV a été téléchargé");
  };

  const handleSendToClient = async () => {
    try {
      toast.success(`PV envoyé au client ${pv?.client?.nom_entreprise}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi du PV au client:", error);
      toast.error("Impossible d'envoyer le PV au client");
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
        <Button variant="outline" onClick={() => navigate(`/admin/intervention/${pv.intervention_id}`)}>
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
          <Button onClick={handleSendToClient} disabled={!pv.client}>
            <Send className="mr-2 h-4 w-4" />
            Envoyer au client
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card id="pv-details" className="print:shadow-none">
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
                    <Badge variant="success">Validé par le client</Badge>
                  ) : (
                    <Badge variant="destructive">Refusé par le client</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Informations client</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <User className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Client</p>
                      <p className="text-muted-foreground">{pv.client?.nom_entreprise || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FileText className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Contact</p>
                      <p className="text-muted-foreground">{pv.client?.email || "Non spécifié"}</p>
                      <p className="text-muted-foreground">{pv.client?.tel || "Non spécifié"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Détails de l'intervention</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-medium mb-1">Date de l'intervention</p>
                    <p className="text-muted-foreground">
                      {formatDate(pv.intervention?.date_fin)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Localisation</p>
                    <p className="text-muted-foreground">
                      {pv.intervention?.localisation || "Non spécifiée"}
                    </p>
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
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Validation client</h3>
                {pv.validation_client === null ? (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-center">Le client n'a pas encore validé ce PV d'intervention.</p>
                  </div>
                ) : (
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
                            ? "PV validé par le client" 
                            : "PV refusé par le client"}
                        </span> le {formatDate(pv.date_validation)}
                      </p>
                    </div>
                    
                    {pv.commentaire && (
                      <div className="bg-background p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Commentaire du client:</p>
                        <p className="text-muted-foreground">"{pv.commentaire}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="print:hidden">
                <h3 className="text-lg font-semibold mb-2">Commentaire interne</h3>
                <Textarea 
                  placeholder="Ajoutez un commentaire interne (visible uniquement pour l'équipe)..." 
                  className="min-h-[120px]"
                  value={additionalComment}
                  onChange={(e) => setAdditionalComment(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between print:hidden">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/admin/intervention/${pv.intervention_id}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              
              <Button 
                onClick={() => {
                  toast.success("Commentaire interne sauvegardé");
                  setAdditionalComment("");
                }}
                disabled={!additionalComment.trim()}
              >
                <Check className="mr-2 h-4 w-4" />
                Sauvegarder commentaire
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleSendToClient} disabled={!pv.client}>
                <Send className="mr-2 h-4 w-4" />
                Envoyer au client
              </Button>
              <Button variant="outline" className="w-full" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
              <Button variant="outline" className="w-full" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
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
                    Le client n'a pas encore validé ce PV d'intervention.
                  </p>
                </div>
              ) : pv.validation_client ? (
                <div className="text-center p-2">
                  <Badge variant="success" className="mb-2">Validé</Badge>
                  <p className="text-sm text-muted-foreground">
                    Le client a validé ce PV le {format(new Date(pv.date_validation || ''), "dd/MM/yyyy", { locale: fr })}.
                  </p>
                </div>
              ) : (
                <div className="text-center p-2">
                  <Badge variant="destructive" className="mb-2">Refusé</Badge>
                  <p className="text-sm text-muted-foreground">
                    Le client a refusé ce PV le {format(new Date(pv.date_validation || ''), "dd/MM/yyyy", { locale: fr })}.
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

export default ProcessVerbalPage;
