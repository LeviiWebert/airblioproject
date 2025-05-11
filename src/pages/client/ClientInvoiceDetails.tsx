
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface InvoiceDetail {
  id: string;
  description: string;
  heures_travaillees: number;
  taux_horaire: number;
}

interface Invoice {
  id: string;
  date_facturation: string;
  montant_total: number;
  statut_paiement: "en_attente" | "payée" | "annulée";
  details?: InvoiceDetail[];
  intervention?: {
    id: string;
    localisation: string;
    date_fin: string | null;
  };
}

const ClientInvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clientId } = useAuth();

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || !clientId) return;

      try {
        // Récupérer la facture avec ses détails
        const { data, error } = await supabase
          .from('facturations')
          .select(`
            *,
            intervention:intervention_id (
              id,
              localisation,
              date_fin,
              demande_intervention_id
            ),
            details:details_facturation (
              id,
              description,
              heures_travaillees,
              taux_horaire
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;

        if (data) {
          // Vérifier si cette facture appartient au client connecté
          if (data.intervention?.demande_intervention_id) {
            const { data: demandeData, error: demandeError } = await supabase
              .from('demande_interventions')
              .select('client_id')
              .eq('id', data.intervention.demande_intervention_id)
              .single();
            
            if (demandeError) throw demandeError;
            
            if (demandeData.client_id !== clientId) {
              setError("Vous n'êtes pas autorisé à consulter cette facture");
              setLoading(false);
              return;
            }
          } else {
            setError("Information d'intervention incomplète");
            setLoading(false);
            return;
          }
          
          setInvoice(data);
        }
      } catch (error: any) {
        console.error("Erreur lors du chargement de la facture:", error);
        setError(error.message || "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, clientId]);

  const formatDate = (date: string | null) => {
    if (!date) return "Non définie";
    return format(new Date(date), "dd MMMM yyyy", { locale: fr });
  };

  const getStatusBadge = (status: "en_attente" | "payée" | "annulée") => {
    switch (status) {
      case "payée":
        return <Badge className="bg-green-500">Payée</Badge>;
      case "annulée":
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const generatePDF = async () => {
    if (!invoice) return;

    const content = document.getElementById('invoice-content');
    if (!content) return;

    try {
      const canvas = await html2canvas(content, {
        width: content.offsetWidth * 2,
        height: content.offsetHeight * 2
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`facture-${invoice.id.split('-')[0]}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button variant="outline" onClick={() => navigate('/client/invoices')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux factures
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="mb-4">Facture introuvable</p>
              <Button variant="outline" onClick={() => navigate('/client/invoices')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux factures
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => navigate('/client/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux factures
        </Button>
        <Button onClick={generatePDF}>
          <Download className="mr-2 h-4 w-4" /> Télécharger PDF
        </Button>
      </div>
      
      <div id="invoice-content" className="bg-white">
        <Card className="mb-6">
          <CardHeader className="border-b">
            <div className="flex justify-between">
              <div>
                <CardTitle>Facture: FAC-{invoice.id.split('-')[0]}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Date d'émission: {formatDate(invoice.date_facturation)}
                </p>
              </div>
              <div>
                {getStatusBadge(invoice.statut_paiement)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="intervention">Intervention</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-4">Détails de la facturation</h3>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Heures</TableHead>
                          <TableHead>Taux horaire</TableHead>
                          <TableHead>Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.details && invoice.details.map((detail) => (
                          <TableRow key={detail.id}>
                            <TableCell>{detail.description}</TableCell>
                            <TableCell>{detail.heures_travaillees}h</TableCell>
                            <TableCell>{detail.taux_horaire.toLocaleString('fr-FR')} €/h</TableCell>
                            <TableCell>
                              {(detail.heures_travaillees * detail.taux_horaire).toLocaleString('fr-FR')} €
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="intervention">
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-4">Détails de l'intervention</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Localisation</p>
                      <p>{invoice.intervention?.localisation || "Non définie"}</p>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Date de fin d'intervention</p>
                      <p>{formatDate(invoice.intervention?.date_fin)}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="border-t flex justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Référence: FAC-{invoice.id.split('-')[0]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{invoice.montant_total.toLocaleString('fr-FR')} €</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

// Helper component
const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="w-full">
    {children}
  </table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-muted/50">
    {children}
  </thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>
    {children}
  </tbody>
);

const TableRow = ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className="border-b last:border-0" {...props}>
    {children}
  </tr>
);

const TableHead = ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <th className="text-left p-3 text-sm font-medium" {...props}>
    {children}
  </th>
);

const TableCell = ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <td className="p-3" {...props}>
    {children}
  </td>
);

export default ClientInvoiceDetails;
