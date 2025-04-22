
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Calendar,
  MapPin,
  ArrowUpRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { pvInterventionService } from "@/services/dataService";

const PVList = () => {
  const navigate = useNavigate();
  const { clientId } = useAuth();
  const [pvs, setPvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPVs = async () => {
      if (!clientId) return;
      
      try {
        setLoading(true);
        console.log("Fetching PVs for client ID:", clientId);
        const pvsData = await pvInterventionService.getPVsByClientId(clientId);
        console.log("PVs fetched:", pvsData);
        setPvs(pvsData || []);
      } catch (error) {
        console.error("Erreur lors du chargement des PVs:", error);
        toast.error("Impossible de charger vos procès-verbaux");
      } finally {
        setLoading(false);
      }
    };

    fetchPVs();
  }, [clientId]);

  const getStatusBadge = (pv: any) => {
    if (pv.validation_client === null) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          En attente
        </Badge>
      );
    } else if (pv.validation_client) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Validé
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Refusé
        </Badge>
      );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non définie";
    return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Procès-verbaux d'intervention</h1>
          <p className="text-muted-foreground">
            Consultez et validez les procès-verbaux de vos interventions
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="pt-2">
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pvs.length === 0 ? (
        <Card className="text-center p-8">
          <div className="flex justify-center mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Aucun procès-verbal disponible</h2>
          <p className="text-muted-foreground mb-6">
            Vous n'avez actuellement aucun procès-verbal d'intervention à consulter.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pvs.map((pv) => (
            <Card key={pv.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    PV d'intervention
                  </CardTitle>
                  {getStatusBadge(pv)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Créé le {formatDate(pv.created_at)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pv.intervention && (
                    <>
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>
                          <span className="font-medium">Date:</span>{" "}
                          {pv.intervention.date_fin 
                            ? formatDate(pv.intervention.date_fin) 
                            : "Non spécifiée"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>
                          <span className="font-medium">Lieu:</span>{" "}
                          {pv.intervention.localisation || "Non spécifié"}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="pt-2">
                    <Button 
                      className="w-full flex items-center justify-between"
                      onClick={() => navigate(`/client/pv/${pv.id}`)}
                    >
                      <span>Consulter le PV</span>
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PVList;
