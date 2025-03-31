
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Intervention {
  id: string;
  dateDebut: Date;
  localisation: string;
  statut: string;
  clientNom: string;
  description: string;
  equipe: string;
}

interface UpcomingInterventionsProps {
  interventions: Intervention[];
}

export const UpcomingInterventions = ({ interventions }: UpcomingInterventionsProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planifiée":
        return <Badge variant="outline" className="status-badge status-badge-pending">Planifiée</Badge>;
      case "en_cours":
        return <Badge variant="outline" className="status-badge status-badge-in-progress">En cours</Badge>;
      default:
        return <Badge variant="outline" className="status-badge">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Prochaines interventions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interventions.length > 0 ? (
            interventions.map((intervention) => (
              <div key={intervention.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <h3 className="font-medium">{intervention.clientNom}</h3>
                  <div className="flex items-center mt-1 sm:mt-0">
                    <time className="text-sm text-muted-foreground mr-2">
                      {format(intervention.dateDebut, "d MMMM", { locale: fr })}
                    </time>
                    {getStatusBadge(intervention.statut)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{intervention.description}</p>
                <div className="mt-2 flex flex-wrap items-center text-xs text-muted-foreground">
                  <span className="mr-3">{intervention.localisation}</span>
                  <span>Équipe: {intervention.equipe}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucune intervention prochaine</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
