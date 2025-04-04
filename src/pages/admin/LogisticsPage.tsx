
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const LogisticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [logistics, setLogistics] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogistics = async () => {
      setLoading(true);
      try {
        // Ici nous combinons suivi_equipes et suivi_materiels pour avoir une vue logistique complète
        const [equipeResponse, materielResponse] = await Promise.all([
          supabase
            .from('suivi_equipes')
            .select(`
              *,
              equipe:equipe_id (nom, specialisation),
              intervention:intervention_id (id, statut, localisation)
            `),
          supabase
            .from('suivi_materiels')
            .select(`
              *,
              materiel:materiel_id (reference, type_materiel),
              intervention:intervention_id (id, statut, localisation)
            `)
        ]);
          
        if (equipeResponse.error) throw equipeResponse.error;
        if (materielResponse.error) throw materielResponse.error;
        
        // Nous combinons les deux ensembles de données avec un type pour différencier
        const combinedData = [
          ...(equipeResponse.data || []).map(item => ({ ...item, type: 'equipe' })),
          ...(materielResponse.data || []).map(item => ({ ...item, type: 'materiel' }))
        ];
        
        setLogistics(combinedData);
      } catch (error: any) {
        console.error("Erreur lors du chargement des données logistiques:", error);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les données logistiques.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLogistics();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logistique</h1>
        <p className="text-muted-foreground">
          Suivez la localisation et les mouvements des équipes et du matériel.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement des données logistiques...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Nom/Référence</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logistics.length > 0 ? (
                logistics.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.type === 'equipe' ? 'Équipe' : 'Matériel'}
                    </TableCell>
                    <TableCell>
                      {item.type === 'equipe' 
                        ? item.equipe?.nom 
                        : item.materiel?.reference}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {item.localisation || item.intervention?.localisation || "Non spécifiée"}
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(item.type === 'equipe' ? item.date_affectation : item.date_suivi), 
                        "dd/MM/yyyy", 
                        { locale: fr }
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <Truck className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Aucune donnée logistique trouvée.
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

export default LogisticsPage;
