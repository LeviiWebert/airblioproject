
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Invoice {
  id: string;
  date_facturation: string;
  montant_total: number;
  statut_paiement: "en_attente" | "payée" | "annulée";
  intervention?: {
    id: string;
    localisation: string;
    date_fin: string | null;
  };
}

const ClientInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { clientId } = useAuth();

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!clientId) return;
      
      try {
        // Récupération de toutes les interventions liées au client
        const { data: interventions, error: interventionError } = await supabase
          .from('interventions')
          .select(`
            id,
            localisation,
            date_fin,
            demande_intervention_id
          `)
          .eq('statut', 'terminée');
        
        if (interventionError) throw interventionError;

        if (!interventions || interventions.length === 0) {
          setInvoices([]);
          setLoading(false);
          return;
        }

        // Filtrer les interventions dont la demande est liée au client actuel
        const filteredInterventionIds: string[] = [];
        
        for (const intervention of interventions) {
          if (intervention.demande_intervention_id) {
            const { data: demande } = await supabase
              .from('demande_interventions')
              .select('client_id')
              .eq('id', intervention.demande_intervention_id)
              .single();
              
            if (demande && demande.client_id === clientId) {
              filteredInterventionIds.push(intervention.id);
            }
          }
        }

        if (filteredInterventionIds.length === 0) {
          setInvoices([]);
          setLoading(false);
          return;
        }

        // Récupération des facturations associées aux interventions du client
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('facturations')
          .select(`
            id,
            date_facturation,
            montant_total,
            statut_paiement,
            intervention:intervention_id (
              id,
              localisation,
              date_fin
            )
          `)
          .in('intervention_id', filteredInterventionIds);
        
        if (invoicesError) throw invoicesError;
        setInvoices(invoicesData || []);
      } catch (error) {
        console.error("Erreur lors du chargement des factures:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [clientId]);

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
          <CardTitle>Mes factures</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>Vous n'avez pas encore de factures</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/client/invoice/${invoice.id}`)}
                  >
                    <TableCell>FAC-{invoice.id.split('-')[0]}</TableCell>
                    <TableCell>{formatDate(invoice.date_facturation)}</TableCell>
                    <TableCell>{invoice.intervention?.localisation || "N/A"}</TableCell>
                    <TableCell>{invoice.montant_total.toLocaleString('fr-FR')} €</TableCell>
                    <TableCell>{getStatusBadge(invoice.statut_paiement)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientInvoices;
