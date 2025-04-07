
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { PlusCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RecentInterventionsProps {
  loading: boolean;
  interventions: any[];
}

export const RecentInterventions = ({ loading, interventions }: RecentInterventionsProps) => {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Interventions récentes</CardTitle>
        <CardDescription>
          Vos dernières demandes et interventions
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : interventions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-4">Vous n'avez pas encore de demandes d'intervention.</p>
            <Link to="/intervention/request">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Créer une demande
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            {interventions.slice(0, 5).map((intervention) => (
              <div 
                key={intervention.id} 
                className="border-b last:border-0 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        #{intervention.id.substring(0, 8).toUpperCase()}
                      </h3>
                      {intervention.intervention_id ? (
                        <InterventionStatusBadge status={intervention.interventions?.statut || "en_attente"} />
                      ) : (
                        <InterventionStatusBadge status={intervention.statut} />
                      )}
                      <PriorityBadge priority={intervention.urgence} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(intervention.date_demande), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <Link to={`/client/intervention/${intervention.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                  </Link>
                </div>
                <p className="text-sm line-clamp-1">
                  {intervention.description}
                </p>
              </div>
            ))}
            {interventions.length > 5 && (
              <div className="p-4 text-center">
                <Link to="/client/interventions">
                  <Button variant="outline" size="sm">
                    Voir toutes les interventions
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
