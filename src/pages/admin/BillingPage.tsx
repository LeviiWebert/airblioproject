
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Receipt, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getFacturations, FacturationWithDetails } from "@/services/supabaseService/facturationService";
import AddInvoiceDialog from "@/components/dialogs/AddInvoiceDialog";
import EditInvoiceDialog from "@/components/dialogs/EditInvoiceDialog";
import DeleteInvoiceDialog from "@/components/dialogs/DeleteInvoiceDialog";

const BillingPage = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<FacturationWithDetails[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<FacturationWithDetails | null>(null);
  
  // États pour les dialogues
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getFacturations();
      setInvoices(data);
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

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleEditInvoice = (invoice: FacturationWithDetails) => {
    setSelectedInvoice(invoice);
    setEditDialogOpen(true);
  };

  const handleDeleteInvoice = (invoice: FacturationWithDetails) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

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
        <Button className="flex items-center gap-2" onClick={() => setAddDialogOpen(true)}>
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
                    <TableCell>{Number(invoice.montant_total).toFixed(2)} €</TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(invoice.statut_paiement)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" 
                        onClick={() => handleDeleteInvoice(invoice)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
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

      {/* Dialogue pour ajouter une facture */}
      <AddInvoiceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onInvoiceAdded={fetchInvoices}
      />

      {/* Dialogue pour modifier une facture */}
      {selectedInvoice && (
        <EditInvoiceDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          invoice={selectedInvoice}
          onInvoiceUpdated={fetchInvoices}
        />
      )}

      {/* Dialogue pour supprimer une facture */}
      {selectedInvoice && (
        <DeleteInvoiceDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          invoiceId={selectedInvoice.id}
          invoiceRef={`FACT-${selectedInvoice.id.substring(0, 8).toUpperCase()}`}
          onInvoiceDeleted={fetchInvoices}
        />
      )}
    </div>
  );
};

export default BillingPage;
