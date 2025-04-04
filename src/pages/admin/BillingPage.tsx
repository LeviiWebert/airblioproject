
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const BillingPage = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('facturations')
          .select(`
            *,
            intervention:intervention_id (
              id,
              demande_intervention_id,
              localisation
            )
          `);
          
        if (error) throw error;
        
        // Récupérer les clients associés via les demandes d'intervention
        if (data && data.length > 0) {
          const interventionIds = data
            .filter(item => item.intervention?.demande_intervention_id)
            .map(item => item.intervention.demande_intervention_id);
          
          if (interventionIds.length > 0) {
            const { data: demandesData, error: demandesError } = await supabase
              .from('demande_interventions')
              .select(`
                id,
                client_id,
                client:client_id (nom_entreprise)
              `)
              .in('id', interventionIds);
            
            if (demandesError) throw demandesError;
            
            // Ajouter les informations du client à chaque facture
            const enrichedData = data.map(invoice => {
              if (invoice.intervention?.demande_intervention_id) {
                const matchingDemande = demandesData?.find(
                  demande => demande.id === invoice.intervention.demande_intervention_id
                );
                return {
                  ...invoice,
                  client: matchingDemande?.client
                };
              }
              return invoice;
            });
            
            setInvoices(enrichedData);
          } else {
            setInvoices(data);
          }
        } else {
          setInvoices([]);
        }
      } catch (error: any) {
        console.error("Erreur lors du chargement des factures:", error);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les factures.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [toast]);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'payée':
        return <Badge className="bg-green-500">Payée</Badge>;
      case 'en_attente':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">En attente</Badge>;
      case 'annulée':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="outline">Non défini</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturation</h1>
          <p className="text-muted-foreground">
            Consultez et gérez les factures des interventions.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Nouvelle facture</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement des factures...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      FACT-{invoice.id.substring(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.date_facturation), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{invoice.client?.nom_entreprise || "Client inconnu"}</TableCell>
                    <TableCell>{invoice.montant_total.toFixed(2)} €</TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(invoice.statut_paiement)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <Receipt className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Aucune facture trouvée.
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

export default BillingPage;
