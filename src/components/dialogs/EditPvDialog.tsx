
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { pvInterventionService } from "@/services/dataService";
import { useAuth } from "@/hooks/useAuth";

interface EditPvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interventionId: string;
  clientId: string | { id: string };
  initialPvId?: string;
  onSaved?: () => void;
}

export function EditPvDialog({ open, onOpenChange, interventionId, clientId, initialPvId, onSaved }: EditPvDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rapport, setRapport] = useState("");
  const [loading, setLoading] = useState(false);
  const [pvId, setPvId] = useState<string | undefined>(initialPvId);

  useEffect(() => {
    if (!open) return;
    
    const fetchPv = async () => {
      try {
        if (initialPvId) {
          const data = await pvInterventionService.getPVById(initialPvId);
          if (data) {
            setPvId(data.id);
            setRapport(data.intervention?.rapport || "");
          }
        } else {
          const data = await pvInterventionService.getPVByInterventionId(interventionId);
          if (data) {
            setPvId(data.id);
            setRapport(data.intervention?.rapport || "");
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du PV:", error);
      }
    };
    
    fetchPv();
  }, [open, initialPvId, interventionId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Mise à jour du rapport d'intervention
      if (rapport) {
        await pvInterventionService.updateInterventionReport(interventionId, rapport);
      }
      
      // Création ou mise à jour du PV
      const result = await pvInterventionService.createPv({
        clientId: clientId,
        interventionId: interventionId,
        validation_client: null, // Seul le client peut valider
        commentaire: "", // Le commentaire est réservé au client
      });
      
      if (result) {
        setPvId(result.id);
      }
      
      if (onSaved) onSaved();
      onOpenChange(false);
      
      toast({
        title: pvId ? "PV mis à jour" : "PV créé",
        description: "Le PV a été enregistré avec succès."
      });
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde du PV:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le PV."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Édition du PV d'intervention</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">
                Rapport d'intervention
              </label>
              <Textarea
                value={rapport}
                onChange={(e) => setRapport(e.target.value)}
                placeholder="Saisissez le rapport d'intervention"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {pvId ? "Mettre à jour" : "Créer le PV"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
