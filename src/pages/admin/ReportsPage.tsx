
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { pvInterventionService } from "@/services/dataService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PV {
  id: string;
  validation_client: boolean | null;
  date_validation: string | null;
  client?: { nom_entreprise: string };
  intervention?: { 
    id: string;
    date_fin: string | null;
  };
  facturation?: { id: string } | null;
}

const ReportsPage = () => {
  const navigate = useNavigate();
  const [pvs, setPvs] = useState<PV[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPVs = async () => {
      try {
        // Fetch all PVs using Supabase query
        const { data, error } = await supabase
          .from('pv_interventions')
          .select(`
            id,
            validation_client,
            date_validation,
            commentaire,
            client:clients(nom_entreprise),
            intervention:interventions(
              id,
              date_fin,
              rapport,
              localisation
            )
          `);

        if (error) throw error;
        
        // Récupérer les facturations liées aux interventions pour savoir lesquelles ont déjà une facture
        const pvData = data || [];
        const interventionIds = pvData
          .filter(pv => pv.intervention)
          .map(pv => pv.intervention?.id)
          .filter(Boolean) as string[];

        if (interventionIds.length > 0) {
          const { data: facturations } = await supabase
            .from('facturations')
            .select('id, intervention_id')
            .in('intervention_id', interventionIds);

          if (facturations) {
            // Associer les facturations aux PVs correspondants
            const pvsWithFacturations = pvData.map(pv => {
              const facturation = facturations.find(
                f => f.intervention_id === pv.intervention?.id
              );
              return {
                ...pv,
                facturation: facturation ? { id: facturation.id } : null
              };
            });
            setPvs(pvsWithFacturations);
          } else {
            setPvs(pvData);
          }
        } else {
          setPvs(pvData);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des PVs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPVs();
  }, []);

  const formatDate = (date: string | null) => {
    if (!date) return "Non définie";
    return format(new Date(date), "dd MMMM yyyy", { locale: fr });
  };

  const getStatusBadge = (validationClient: boolean | null) => {
    if (validationClient === null) {
      return <Badge variant="outline">En attente</Badge>;
    } else if (validationClient) {
      return <Badge className="bg-green-500">Validé</Badge>;
    } else {
      return <Badge variant="destructive">Refusé</Badge>;
    }
  };

  const handleCreateOrEditInvoice = (pv: PV, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!pv.intervention?.id) return;
    
    if (pv.facturation?.id) {
      navigate(`/admin/facturation/${pv.facturation.id}/edit`);
    } else {
      navigate(`/admin/facturation/new?interventionId=${pv.intervention.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Procès-verbaux d'intervention</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pvs.map((pv) => (
                <TableRow 
                  key={pv.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/pv/${pv.id}`)}
                >
                  <TableCell>{pv.client?.nom_entreprise || "N/A"}</TableCell>
                  <TableCell>{formatDate(pv.intervention?.date_fin)}</TableCell>
                  <TableCell>{getStatusBadge(pv.validation_client)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/admin/pv/${pv.id}`)}
                        size="sm"
                      >
                        Voir détails
                      </Button>
                      {pv.validation_client === true && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-green-50 hover:bg-green-100 text-green-700"
                          onClick={(e) => handleCreateOrEditInvoice(pv, e)}
                        >
                          <Receipt className="mr-2 h-4 w-4" />
                          {pv.facturation ? "Éditer facture" : "Facturer"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
