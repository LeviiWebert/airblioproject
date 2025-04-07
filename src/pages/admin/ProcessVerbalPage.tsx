import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, FileText, User, Building, CheckCircle, XCircle, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface PvIntervention {
  id: string;
  validation_client: boolean | null;
  date_validation: string | null;
  commentaire: string | null;
  client_id: string;
  intervention_id: string;
  client?: Client;
  intervention?: Intervention;
}

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

const ProcessVerbalPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pv, setPv] = useState<PvIntervention | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPvDetails = async () => {
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
            client_id,
            intervention_id,
            client:client_id (
              id,
              nom_entreprise,
              email,
              tel
            ),
            intervention:intervention_id (
              id,
              date_debut,
              date_fin,
              rapport,
              statut,
              localisation
            )
          `)
          .eq('id', id)
          .single();
          
        if (pvError) throw pvError;
        
        setPv(pvData);
        
      } catch (error) {
        console.error("Erreur lors du chargement du PV:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les détails du PV d'intervention."
        });
        navigate('/admin/interventions');
      } finally {
        setLoading(false);
      }
    };

    fetchPvDetails();
  }, [id, navigate, toast]);

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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              Le procès-verbal que vous recherchez n'existe pas ou a été supprimé.
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
        
        <div className="flex gap-2">
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

      <Card className="border shadow-md print:border-none print:shadow-none">
        <CardHeader className="print:pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">
                Procès-Verbal d'Intervention
              </CardTitle>
              <CardDescription>
                {pv.intervention?.date_fin && (
                  <span>Intervention réalisée le {formatDate(pv.intervention.date_fin)}</span>
                )}
              </CardDescription>
            </div>
            
            <div>
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
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Building className="mr-2 h-5 w-5 text-primary" />
                Informations Client
              </h3>
              <div className="bg-slate-50 p-4 rounded-md space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="font-medium">{pv.client?.nom_entreprise}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p>{pv.client?.email}</p>
                  <p>{pv.client?.tel}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Détails de l'Intervention
              </h3>
              <div className="bg-slate-50 p-4 rounded-md space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date de début</p>
                    <p>{formatDate(pv.intervention?.date_debut)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date de fin</p>
                    <p>{formatDate(pv.intervention?.date_fin)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Localisation</p>
                  <p>{pv.intervention?.localisation}</p>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Rapport d'Intervention</h3>
            <div className="bg-slate-50 p-4 rounded-md">
              {pv.intervention?.rapport ? (
                <p className="whitespace-pre-line">{pv.intervention.rapport}</p>
              ) : (
                <p className="text-muted-foreground italic">Aucun rapport disponible</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Validation Client</h3>
            <div className="bg-slate-50 p-4 rounded-md">
              {pv.validation_client === null ? (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                  <p>En attente de validation du client</p>
                </div>
              ) : pv.validation_client ? (
                <div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <p>
                      <span className="font-medium">PV validé par le client</span> le {formatDate(pv.date_validation)}
                    </p>
                  </div>
                  
                  {pv.commentaire && (
                    <div className="mt-4 p-3 bg-white rounded-md border">
                      <p className="text-sm font-medium mb-1">Commentaire du client:</p>
                      <p className="text-sm text-muted-foreground">"{pv.commentaire}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p>
                      <span className="font-medium">PV refusé par le client</span> le {formatDate(pv.date_validation)}
                    </p>
                  </div>
                  
                  {pv.commentaire && (
                    <div className="mt-4 p-3 bg-white rounded-md border">
                      <p className="text-sm font-medium mb-1">Motif du refus:</p>
                      <p className="text-sm text-muted-foreground">"{pv.commentaire}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6 print:hidden">
          <Button variant="outline" onClick={() => navigate(`/admin/intervention/${pv.intervention_id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'intervention
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            <Button onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProcessVerbalPage;
