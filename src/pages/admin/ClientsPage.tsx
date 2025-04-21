
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Client } from "@/types/models";
import AddClientDialog from "@/components/dialogs/AddClientDialog";
import EditClientDialog from "@/components/dialogs/EditClientDialog";
import DeleteClientDialog from "@/components/dialogs/DeleteClientDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/services/dataService";

const ClientsPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // Utiliser React Query pour récupérer les données des clients
  const {
    data: clients = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      try {
        const data = await clientService.getAll();
        
        // Transformer les données pour correspondre à notre type Client
        return data.map((client) => ({
          id: client.id,
          nomEntreprise: client.nom_entreprise,
          email: client.email || '',
          tel: client.tel || '',
          identifiant: client.identifiant || '',
          mdp: client.mdp || ''
        }));
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
        throw error;
      }
    },
    staleTime: 60000 // 1 minute
  });

  // Afficher les erreurs avec toast si nécessaire
  if (error) {
    console.error("Erreur de requête:", error);
    toast({
      variant: "destructive",
      title: "Erreur de chargement",
      description: "Impossible de charger les clients.",
    });
  }

  const handleAddClient = () => {
    if (isPending) return;
    startTransition(() => {
      setIsAddDialogOpen(true);
    });
  };

  const handleEdit = (client: Client) => {
    if (isPending) return;
    startTransition(() => {
      setSelectedClient(client);
      setIsEditDialogOpen(true);
    });
  };

  const handleDelete = (client: Client) => {
    if (isPending) return;
    startTransition(() => {
      setSelectedClient(client);
      setIsDeleteDialogOpen(true);
    });
  };

  const refreshClients = () => {
    // Cette fonction doit rester simple et légère car elle est déjà encapsulée dans startTransition
    // dans les composants de dialogue
    queryClient.invalidateQueries({ queryKey: ["clients"] });
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
          onClick={handleAddClient}
          disabled={isPending}
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau client</span>
        </Button>
      </div>

      {isLoading ? (
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
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(client)}
                          disabled={isPending}
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
        onClientAdded={refreshClients}
      />

      {selectedClient && (
        <>
          <EditClientDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onClientUpdated={refreshClients}
            client={selectedClient}
          />

          <DeleteClientDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onClientDeleted={refreshClients}
            clientId={selectedClient.id}
            clientName={selectedClient.nomEntreprise}
          />
        </>
      )}
    </div>
  );
};

export default ClientsPage;
