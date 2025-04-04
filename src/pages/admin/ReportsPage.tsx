
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // Simuler le chargement des données
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Données fictives pour l'exemple
        const mockReports = [
          { id: 1, title: "PV d'intervention - Port de Marseille", date: "2025-03-15", type: "intervention", status: "validated" },
          { id: 2, title: "Rapport d'équipement - Plateforme A", date: "2025-03-10", type: "equipment", status: "pending" },
          { id: 3, title: "Bilan trimestriel - Q1 2025", date: "2025-04-01", type: "summary", status: "validated" },
          { id: 4, title: "PV d'intervention - Terminal pétrolier", date: "2025-02-28", type: "intervention", status: "validated" },
          { id: 5, title: "Rapport d'incident - Site offshore", date: "2025-03-22", type: "incident", status: "pending" },
        ];
        
        setReports(mockReports);
      } catch (error) {
        console.error("Erreur lors du chargement des rapports:", error);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les rapports.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  // Filtrer les rapports selon le type sélectionné
  const filteredReports = filter === "all" 
    ? reports 
    : reports.filter(report => report.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PV d'interventions et Rapports</h1>
        <p className="text-muted-foreground">
          Consultez et gérez tous les rapports et PV d'interventions.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="intervention">PV d'intervention</SelectItem>
              <SelectItem value="equipment">Rapport d'équipement</SelectItem>
              <SelectItem value="summary">Bilan</SelectItem>
              <SelectItem value="incident">Rapport d'incident</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Nouveau rapport
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement des rapports...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>{new Date(report.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      {report.type === "intervention" && "PV d'intervention"}
                      {report.type === "equipment" && "Rapport d'équipement"}
                      {report.type === "summary" && "Bilan"}
                      {report.type === "incident" && "Rapport d'incident"}
                    </TableCell>
                    <TableCell>
                      {report.status === "validated" ? (
                        <Badge variant="default" className="bg-green-500">Validé</Badge>
                      ) : (
                        <Badge variant="outline">En attente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Aucun rapport trouvé.
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
