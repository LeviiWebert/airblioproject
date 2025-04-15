
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AssignEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interventionId: string;
  onEquipmentAssigned: () => void;
}

const AssignEquipmentDialog = ({ open, onOpenChange, interventionId, onEquipmentAssigned }: AssignEquipmentDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [currentEquipment, setCurrentEquipment] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, interventionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer le matériel disponible
      const { data: availableData, error: availableError } = await supabase
        .from('materiels')
        .select('*')
        .in('etat', ['disponible']);
      
      if (availableError) throw availableError;
      
      // Récupérer le matériel actuellement assigné à cette intervention
      const { data: assignedData, error: assignedError } = await supabase
        .from('intervention_materiels')
        .select(`
          materiel_id,
          materiels:materiel_id (
            id,
            reference,
            type_materiel,
            etat
          )
        `)
        .eq('intervention_id', interventionId);
      
      if (assignedError) throw assignedError;
      
      const currentAssignedIds = assignedData.map(item => item.materiel_id);
      setCurrentEquipment(currentAssignedIds);
      
      // Combiner le matériel disponible avec celui déjà assigné
      const { data: currentMaterialData, error: currentMaterialError } = await supabase
        .from('materiels')
        .select('*')
        .in('id', currentAssignedIds);
        
      if (currentMaterialError) throw currentMaterialError;
      
      // Fusion des deux listes sans doublons
      const allEquipment = [...availableData];
      if (currentMaterialData) {
        currentMaterialData.forEach(material => {
          if (!allEquipment.some(eq => eq.id === material.id)) {
            allEquipment.push(material);
          }
        });
      }
      
      setAvailableEquipment(allEquipment);
      setSelectedEquipment(currentAssignedIds);
    } catch (error: any) {
      console.error("Erreur lors du chargement du matériel:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le matériel disponible.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (equipmentId: string) => {
    setSelectedEquipment(prev => {
      if (prev.includes(equipmentId)) {
        return prev.filter(id => id !== equipmentId);
      } else {
        return [...prev, equipmentId];
      }
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Supprimer les assignations existantes
      const { error: deleteError } = await supabase
        .from('intervention_materiels')
        .delete()
        .eq('intervention_id', interventionId);
      
      if (deleteError) throw deleteError;
      
      if (selectedEquipment.length > 0) {
        // Préparer les nouvelles assignations
        const newAssignments = selectedEquipment.map(equipId => ({
          intervention_id: interventionId,
          materiel_id: equipId
        }));
        
        // Insérer les nouvelles assignations
        const { error: insertError } = await supabase
          .from('intervention_materiels')
          .insert(newAssignments);
        
        if (insertError) throw insertError;
        
        // Mettre à jour l'état du matériel
        for (const equipId of selectedEquipment) {
          await supabase
            .from('materiels')
            .update({ etat: 'en utilisation' })
            .eq('id', equipId);
        }
        
        // Libérer le matériel désélectionné
        const unselectedEquipment = currentEquipment.filter(id => !selectedEquipment.includes(id));
        for (const equipId of unselectedEquipment) {
          await supabase
            .from('materiels')
            .update({ etat: 'disponible' })
            .eq('id', equipId);
        }
      }
      
      toast({
        title: "Matériel assigné",
        description: "Le matériel a été assigné avec succès à l'intervention.",
      });
      
      onEquipmentAssigned();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erreur lors de l'assignation du matériel:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'assigner le matériel à l'intervention.",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assigner du matériel à l'intervention</DialogTitle>
          <DialogDescription>
            Sélectionnez le matériel à utiliser pour cette intervention.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {availableEquipment.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun matériel disponible pour le moment.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {availableEquipment.map((equipment) => (
                  <div 
                    key={equipment.id} 
                    className="flex items-center space-x-3 border rounded-md p-3 hover:bg-slate-50"
                  >
                    <Checkbox 
                      id={equipment.id}
                      checked={selectedEquipment.includes(equipment.id)}
                      onCheckedChange={() => handleCheckboxChange(equipment.id)}
                      disabled={equipment.etat !== 'disponible' && !selectedEquipment.includes(equipment.id)}
                    />
                    <div className="flex flex-1 justify-between items-center">
                      <label 
                        htmlFor={equipment.id} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <div className="font-medium">{equipment.reference}</div>
                        <div className="text-muted-foreground text-xs mt-1">{equipment.type_materiel}</div>
                      </label>
                      <Badge variant="outline" className={getEquipmentStatusColor(equipment.etat)}>
                        {equipment.etat}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignEquipmentDialog;
