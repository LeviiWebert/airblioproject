
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Wrench, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Materiel } from "@/types/models";
import AddEquipmentDialog from "@/components/dialogs/AddEquipmentDialog";
import EditEquipmentDialog from "@/components/dialogs/EditEquipmentDialog";
import DeleteEquipmentDialog from "@/components/dialogs/DeleteEquipmentDialog";

// Nouveau type incluant info base
type EquipmentWithBase = Materiel & {
  base_nom?: string | null;
};

const EquipmentPage = () => {
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<EquipmentWithBase[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithBase | null>(null);
  const { toast } = useToast();

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      // Jointure pour récupérer le nom de la base
      const { data, error } = await supabase
        .from('materiels')
        .select('*, bases:base_id (nom)')
      if (error) throw error;

      // Transforme la donnée pour l’affichage
      const formattedData: EquipmentWithBase[] = (data || []).map((item: any) => ({
        id: item.id,
        reference: item.reference,
        typeMateriel: item.type_materiel,
        etat: item.etat as "disponible" | "en utilisation" | "en maintenance" | "hors service",
        base_nom: item.bases?.nom ?? null,
        base_id: item.base_id,
      }));

      setEquipment(formattedData);
    } catch (error: any) {
      console.error("Erreur lors du chargement du matériel:", error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger le matériel.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [toast]);

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'disponible':
        return 'bg-green-100 text-green-800';
      case 'en utilisation':
        return 'bg-blue-100 text-blue-800';
      case 'en maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'hors service':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (item: EquipmentWithBase) => {
    setSelectedEquipment(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: EquipmentWithBase) => {
    setSelectedEquipment(item);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion du matériel</h1>
          <p className="text-muted-foreground">
            Consultez et gérez l'inventaire du matériel disponible.
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau matériel</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement du matériel...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Type de matériel</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.length > 0 ? (
                equipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.reference}</TableCell>
                    <TableCell>{item.typeMateriel}</TableCell>
                    <TableCell>{item.base_nom || <span className="text-muted-foreground italic">Non renseignée</span>}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getEquipmentStatusColor(item.etat)}>
                        {item.etat}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(item)}
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
                  <TableCell colSpan={5} className="h-24 text-center">
                    Aucun matériel trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AddEquipmentDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onEquipmentAdded={fetchEquipment}
      />

      {selectedEquipment && (
        <>
          <EditEquipmentDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onEquipmentUpdated={fetchEquipment}
            equipment={selectedEquipment}
          />

          <DeleteEquipmentDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onEquipmentDeleted={fetchEquipment}
            equipmentId={selectedEquipment.id}
            equipmentReference={selectedEquipment.reference}
          />
        </>
      )}
    </div>
  );
};

export default EquipmentPage;
