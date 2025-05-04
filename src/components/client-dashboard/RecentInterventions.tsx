
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { Eye, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RecentInterventions() {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { clientId } = useAuth();

  useEffect(() => {
    const fetchInterventions = async () => {
      if (!clientId) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('demande_interventions')
          .select(`
            id,
            date_demande,
            description,
            urgence,
            statut,
            motif_rejet,
            client_id
          `)
          .eq('client_id', clientId)
          .order('date_demande', { ascending: false })
          .limit(5);

        if (error) throw error;
        setInterventions(data || []);
      } catch (error) {
        console.error('Error fetching recent interventions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterventions();
  }, [clientId]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interventions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="flex items-center">
              <div className="w-full h-12 bg-gray-100 animate-pulse rounded-md"></div>
            </div>
            <div className="flex items-center">
              <div className="w-full h-12 bg-gray-100 animate-pulse rounded-md"></div>
            </div>
            <div className="flex items-center">
              <div className="w-full h-12 bg-gray-100 animate-pulse rounded-md"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Interventions récentes</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link to="/client/interventions">Voir tout</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {interventions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                Aucune intervention récente
              </p>
            </div>
          ) : (
            interventions.map((intervention) => (
              <div key={intervention.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        #{intervention.id.substring(0, 8).toUpperCase()}
                      </h3>
                      <InterventionStatusBadge status={intervention.statut} />
                      <PriorityBadge priority={intervention.urgence} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(intervention.date_demande)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/client/intervention/${intervention.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
                    </Link>
                  </Button>
                </div>

                {/* Affichage du motif de refus si la demande a été rejetée */}
                {intervention.statut === 'rejetée' && intervention.motif_rejet && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription className="text-sm">
                      <strong>Motif du refus :</strong> {intervention.motif_rejet}
                    </AlertDescription>
                  </Alert>
                )}

                <p className="text-sm line-clamp-1">{intervention.description}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
