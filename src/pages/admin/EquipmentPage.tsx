
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EquipmentPage = () => {
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('materiels')
          .select('*');
          
        if (error) throw error;
        
        setEquipment(data || []);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion du matériel</h1>
          <p className="text-muted-foreground">
            Consultez et gérez l'inventaire du matériel disponible.
          </p>
        </div>
        <Button className="flex items-center gap-2">
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
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.length > 0 ? (
                equipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.reference}</TableCell>
                    <TableCell>{item.type_materiel}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getEquipmentStatusColor(item.etat)}>
                        {item.etat}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Voir détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun matériel trouvé.
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

export default EquipmentPage;
