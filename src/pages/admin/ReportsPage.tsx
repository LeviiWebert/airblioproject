
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Download, Filter, Plus, Calendar, FileSearch, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Report {
  id: number;
  title: string;
  date: string;
  type: string;
  status: string;
  content?: string;
  client_id?: string;
  intervention_id?: string;
  author?: string;
}

interface ReportFormData {
  title: string;
  type: string;
  content: string;
  client_id: string;
  intervention_id: string;
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("all");
  const [openNewReportDialog, setOpenNewReportDialog] = useState(false);
  const [openViewReportDialog, setOpenViewReportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState<ReportFormData>({
    title: "",
    type: "intervention",
    content: "",
    client_id: "",
    intervention_id: ""
  });
  const [clients, setClients] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // Fetch real data from your database
        // For now, we'll use mockup data
        const mockReports = [
          { id: 1, title: "PV d'intervention - Port de Marseille", date: "2025-03-15", type: "intervention", status: "validated", content: "Intervention réalisée sur la plateforme offshore du Port de Marseille. Remplacement de l'équipement de surveillance sous-marine. Aucun incident à signaler." },
          { id: 2, title: "Rapport d'équipement - Plateforme A", date: "2025-03-10", type: "equipment", status: "pending", content: "Inspection de l'équipement de la plateforme A. Plusieurs éléments nécessitent une maintenance préventive dans les prochains mois." },
          { id: 3, title: "Bilan trimestriel - Q1 2025", date: "2025-04-01", type: "summary", status: "validated", content: "Bilan des opérations du premier trimestre 2025. Augmentation de 12% des interventions par rapport au trimestre précédent." },
          { id: 4, title: "PV d'intervention - Terminal pétrolier", date: "2025-02-28", type: "intervention", status: "validated", content: "Intervention d'urgence sur le terminal pétrolier suite à une fuite mineure. Situation maîtrisée, recommandations pour éviter les incidents futurs." },
          { id: 5, title: "Rapport d'incident - Site offshore", date: "2025-03-22", type: "incident", status: "pending", content: "Rapport détaillé sur l'incident survenu le 22 mars sur le site offshore. Analyse des causes et propositions d'actions correctives." },
        ];
        
        // Fetch clients and interventions for the form
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, nom_entreprise');
          
        if (clientsData) {
          setClients(clientsData);
        }
        
        const { data: interventionsData } = await supabase
          .from('interventions')
          .select('id, localisation, date_debut');
          
        if (interventionsData) {
          setInterventions(interventionsData);
        }
        
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

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleNewReport = () => {
    setFormData({
      title: "",
      type: "intervention",
      content: "",
      client_id: "",
      intervention_id: ""
    });
    setOpenNewReportDialog(true);
  };

  const handleViewReport = (report: Report) => {
    setCurrentReport(report);
    setOpenViewReportDialog(true);
  };

  const handleCreateReport = () => {
    const newReport = {
      id: reports.length + 1,
      title: formData.title,
      date: new Date().toISOString(),
      type: formData.type,
      status: "pending",
      content: formData.content,
      client_id: formData.client_id,
      intervention_id: formData.intervention_id,
      author: "Admin User"
    };
    
    setReports([newReport, ...reports]);
    setOpenNewReportDialog(false);
    
    toast({
      title: "Rapport créé",
      description: "Le nouveau rapport a été créé avec succès."
    });
  };

  const handleDownloadReport = (id: number) => {
    toast({
      title: "Téléchargement du rapport",
      description: "Le rapport a été téléchargé avec succès."
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filter the reports according to the selected filter and tab
  const getFilteredReports = () => {
    let filtered = reports;
    
    // First apply the type filter
    if (filter !== "all") {
      filtered = filtered.filter(report => report.type === filter);
    }
    
    // Then apply the status filter (tab)
    if (activeTab !== "all") {
      filtered = filtered.filter(report => report.status === activeTab);
    }
    
    return filtered;
  };

  const filteredReports = getFilteredReports();

  // Get a proper label for report types
  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "intervention": return "PV d'intervention";
      case "equipment": return "Rapport d'équipement";
      case "summary": return "Bilan";
      case "incident": return "Rapport d'incident";
      default: return type;
    }
  };

  // Get a proper label for report statuses
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "validated": return "Validé";
      case "pending": return "En attente";
      case "rejected": return "Rejeté";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rapports et PV d'interventions</h1>
        <p className="text-muted-foreground">
          Consultez, créez et gérez tous les rapports et PV d'interventions.
        </p>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 mb-4 sm:mb-0">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="validated">Validés</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={handleFilterChange}>
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
            <Button onClick={handleNewReport}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau rapport
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="m-0">
          {renderReportsTable()}
        </TabsContent>
        <TabsContent value="validated" className="m-0">
          {renderReportsTable()}
        </TabsContent>
        <TabsContent value="pending" className="m-0">
          {renderReportsTable()}
        </TabsContent>
      </Tabs>

      {/* New Report Dialog */}
      <Dialog open={openNewReportDialog} onOpenChange={setOpenNewReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau rapport</DialogTitle>
            <DialogDescription>
              Remplissez les informations nécessaires pour créer un nouveau rapport ou PV.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Titre
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Titre du rapport"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Type de rapport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intervention">PV d'intervention</SelectItem>
                  <SelectItem value="equipment">Rapport d'équipement</SelectItem>
                  <SelectItem value="summary">Bilan périodique</SelectItem>
                  <SelectItem value="incident">Rapport d'incident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(formData.type === "intervention" || formData.type === "incident") && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="intervention" className="text-right">
                  Intervention
                </Label>
                <Select 
                  value={formData.intervention_id} 
                  onValueChange={(value) => handleSelectChange("intervention_id", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner une intervention" />
                  </SelectTrigger>
                  <SelectContent>
                    {interventions.map(intervention => (
                      <SelectItem key={intervention.id} value={intervention.id}>
                        {intervention.localisation} - {intervention.date_debut 
                          ? format(new Date(intervention.date_debut), "dd/MM/yyyy", { locale: fr })
                          : "Non planifiée"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Client
              </Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(value) => handleSelectChange("client_id", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom_entreprise}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="content" className="text-right mt-2">
                Contenu
              </Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="col-span-3 h-40"
                placeholder="Contenu détaillé du rapport..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewReportDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateReport} disabled={!formData.title || !formData.content}>
              Créer le rapport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={openViewReportDialog} onOpenChange={setOpenViewReportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{currentReport?.title}</DialogTitle>
            <DialogDescription>
              {currentReport?.date && format(new Date(currentReport.date), "dd MMMM yyyy", { locale: fr })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Badge variant={currentReport?.status === "validated" ? "default" : "outline"} className={currentReport?.status === "validated" ? "bg-green-500" : ""}>
                  {getStatusLabel(currentReport?.status || "")}
                </Badge>
                <Badge variant="outline">
                  {getReportTypeLabel(currentReport?.type || "")}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                {currentReport?.date && format(new Date(currentReport.date), "HH:mm", { locale: fr })}
              </div>
            </div>
            
            <div className="rounded-md border p-4 bg-muted/30 whitespace-pre-line">
              {currentReport?.content}
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-between">
              <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
                <p>Créé par: {currentReport?.author || "Administrateur"}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setOpenViewReportDialog(false)}>
                  Fermer
                </Button>
                <Button onClick={() => handleDownloadReport(currentReport?.id || 0)}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderReportsTable() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement des rapports...</p>
          </div>
        </div>
      );
    }

    if (filteredReports.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48">
            <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Aucun rapport trouvé</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Aucun rapport ne correspond aux critères sélectionnés ou aucun rapport n'a été créé.
            </p>
            <Button onClick={handleNewReport}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un rapport
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
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
            {filteredReports.map((report) => (
              <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewReport(report)}>
                <TableCell className="font-medium">{report.title}</TableCell>
                <TableCell>{format(new Date(report.date), "dd/MM/yyyy", { locale: fr })}</TableCell>
                <TableCell>
                  {getReportTypeLabel(report.type)}
                </TableCell>
                <TableCell>
                  {report.status === "validated" ? (
                    <Badge variant="default" className="bg-green-500">Validé</Badge>
                  ) : report.status === "rejected" ? (
                    <Badge variant="destructive">Rejeté</Badge>
                  ) : (
                    <Badge variant="outline">En attente</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReport(report);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadReport(report.id);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
};

export default ReportsPage;
