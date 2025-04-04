
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pv_interventions')
          .select(`
            *,
            intervention:intervention_id (
              id, 
              statut,
              rapport
            ),
            client:client_id (
              id,
              nom_entreprise
            )
          `);
          
        if (error) throw error;
        
        setReports(data || []);
      } catch (error: any) {
        console.error("Erreur lors du chargement des PV d'interventions:", error);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les PV d'interventions.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PV d'interventions</h1>
        <p className="text-muted-foreground">
          Consultez les procès-verbaux des interventions terminées.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement des PV d'interventions...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Validation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length > 0 ? (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.date_validation 
                        ? format(new Date(report.date_validation), "dd/MM/yyyy", { locale: fr })
                        : "Non validé"}
                    </TableCell>
                    <TableCell>{report.client?.nom_entreprise || "Client inconnu"}</TableCell>
                    <TableCell>
                      <Badge variant={report.validation_client ? "success" : "outline"}>
                        {report.validation_client ? "Validé" : "En attente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Voir le PV
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun PV d'intervention trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
