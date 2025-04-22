
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { pvInterventionService } from "@/services/dataService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const ReportsPage = () => {
  const navigate = useNavigate();
  const [pvs, setPvs] = useState<any[]>([]);
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
        setPvs(data || []);
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
                <TableRow key={pv.id}>
                  <TableCell>{pv.client?.nom_entreprise || "N/A"}</TableCell>
                  <TableCell>{formatDate(pv.intervention?.date_fin)}</TableCell>
                  <TableCell>{getStatusBadge(pv.validation_client)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/admin/pv/${pv.id}`)}
                    >
                      Voir détails
                    </Button>
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
