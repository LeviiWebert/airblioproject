
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { pvInterventionService } from "@/services/dataService";

interface EditPvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interventionId: string;
  clientId: string;
  initialPvId?: string;
  onSaved?: () => void;
}

export function EditPvDialog({ open, onOpenChange, interventionId, clientId, initialPvId, onSaved }: EditPvDialogProps) {
  const { toast } = useToast();
  const [rapport, setRapport] = useState("");
  const [validationClient, setValidationClient] = useState<boolean | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);

  // Récupérer le PV existant à l'ouverture
  useEffect(() => {
    if (open && initialPvId) {
      setLoading(true);
      pvInterventionService
        .getPVById(initialPvId)
        .then((data: any) => {
          setRapport(data.intervention?.rapport || "");
          setValidationClient(data.validation_client);
          setCommentaire(data.commentaire || "");
        })
        .catch(() => {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger le PV existant"
          });
        })
        .finally(() => setLoading(false));
    } else if (open && interventionId) {
      // Si pas de PV existant, initialiser rapport vide
      setRapport("");
      setValidationClient(null);
      setCommentaire("");
    }
  }, [open, initialPvId, interventionId, toast]);

  // Sauvegarder ou créer le PV
  const handleSave = async () => {
    setLoading(true);
    try {
      if (initialPvId) {
        // Mise à jour du PV existant
        await pvInterventionService.updatePVStatus(initialPvId, validationClient ?? null, commentaire);
        toast({ title: "PV mis à jour", description: "Le PV a été mis à jour avec succès." });
      } else {
        // Création du PV si nécessaire
        await pvInterventionService.createPv({
          clientId: clientId,
          interventionId: interventionId,
          validation_client: validationClient ?? null,
          commentaire,
        });
        toast({ title: "PV créé", description: "Le PV a été créé avec succès." });
      }
      if (onSaved) onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du PV:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le PV." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Édition du PV d'intervention</DialogTitle>
          <DialogDescription>
            Modifiez le PV ou validez la fin de l'intervention.
          </DialogDescription>
        </DialogHeader>
        <form 
          onSubmit={e => { e.preventDefault(); handleSave(); }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="block mb-1 font-medium">Rapport (intervention)</label>
            <Textarea
              value={rapport}
              onChange={e => setRapport(e.target.value)}
              rows={5}
              placeholder="Saisir le rapport d'intervention"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Validation client</label>
            <div className="flex gap-3">
              <Button type="button" variant={validationClient===true ? "default":"outline"} onClick={() => setValidationClient(true)}>
                Validé
              </Button>
              <Button type="button" variant={validationClient===false ? "destructive":"outline"} onClick={() => setValidationClient(false)}>
                Refusé
              </Button>
              <Button type="button" variant={validationClient===null ? "secondary":"outline"} onClick={() => setValidationClient(null)}>
                En attente
              </Button>
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">Commentaire</label>
            <Input
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder="Ajouter un commentaire (optionnel)"
            />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {initialPvId ? "Enregistrer" : "Créer le PV"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
