
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PlusCircle, Eye } from "lucide-react";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InterventionTabsProps {
  loading: boolean;
  interventions: any[];
  pendingInterventions: any[];
  activeInterventions: any[];
  completedInterventions: any[];
}

export const InterventionTabs = ({
  loading,
  interventions,
  pendingInterventions,
  activeInterventions,
  completedInterventions,
}: InterventionTabsProps) => {
  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">Toutes les demandes</TabsTrigger>
        <TabsTrigger value="pending">En attente</TabsTrigger>
        <TabsTrigger value="active">Actives</TabsTrigger>
        <TabsTrigger value="completed">Terminées</TabsTrigger>
      </TabsList>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <TabsContent value="all" className="space-y-4">
            {interventions.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="mb-4">Vous n'avez pas encore de demandes d'intervention.</p>
                  <Link to="/intervention/request">
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Créer une demande
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              renderInterventionsList(interventions)
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingInterventions.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p>Aucune demande en attente.</p>
                </CardContent>
              </Card>
            ) : (
              renderInterventionsList(pendingInterventions)
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeInterventions.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p>Aucune intervention active en ce moment.</p>
                </CardContent>
              </Card>
            ) : (
              renderInterventionsList(activeInterventions)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedInterventions.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p>Aucune intervention terminée.</p>
                </CardContent>
              </Card>
            ) : (
              renderInterventionsList(completedInterventions)
            )}
          </TabsContent>
        </>
      )}
    </Tabs>
  );
  
  function renderInterventionsList(interventions: any[]) {
    return (
      <div className="space-y-4">
        {interventions.map((intervention) => (
          <Card key={intervention.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1">
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        Intervention #{intervention.id.substring(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {intervention.description.length > 100 
                          ? `${intervention.description.substring(0, 100)}...` 
                          : intervention.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <InterventionStatusBadge status={intervention.statut} />
                      <PriorityBadge priority={intervention.urgence} />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Créée le {format(new Date(intervention.date_demande), "dd/MM/yyyy", { locale: fr })}
                    </div>
                    <Link to={`/client/intervention/${intervention.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Voir le récapitulatif
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
};
