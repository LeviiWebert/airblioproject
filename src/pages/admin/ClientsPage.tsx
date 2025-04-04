
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Users, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Client } from "@/types/models";
import AddClientDialog from "@/components/dialogs/AddClientDialog";
import EditClientDialog from "@/components/dialogs/EditClientDialog";
import DeleteClientDialog from "@/components/dialogs/DeleteClientDialog";

const ClientsPage = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*');
          
      if (error) throw error;
      
      // Transform the data to match our Client type
      const formattedData: Client[] = (data || []).map((client) => ({
        id: client.id,
        nomEntreprise: client.nom_entreprise,
        email: client.email || '',
        tel: client.tel || '',
        identifiant: client.identifiant || '',
        mdp: client.mdp || ''
      }));
      
      setClients(formattedData);
    } catch (error: any) {
      console.error("Erreur lors du chargement des clients:", error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les clients.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [toast]);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des clients</h1>
          <p className="text-muted-foreground">
            Consultez et gérez les clients de l'entreprise.
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau client</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement des clients...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.nomEntreprise}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.tel}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(client)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AddClientDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onClientAdded={fetchClients}
      />

      {selectedClient && (
        <>
          <EditClientDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onClientUpdated={fetchClients}
            client={selectedClient}
          />

          <DeleteClientDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onClientDeleted={fetchClients}
            clientId={selectedClient.id}
            clientName={selectedClient.nomEntreprise}
          />
        </>
      )}
    </div>
  );
};

export default ClientsPage;
