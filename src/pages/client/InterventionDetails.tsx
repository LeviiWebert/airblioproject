import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { useClientInterventionDetails } from "@/hooks/useClientInterventionDetails";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Toaster } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { InterventionMainCard } from "./components/InterventionMainCard";
import { InterventionTeamsAndEquipment } from "./components/InterventionTeamsAndEquipment";
import { InterventionRecapSidebar } from "./components/InterventionRecapSidebar";
import { InterventionValidationCard } from "./components/InterventionValidationCard";
import { Alert, AlertDescription } from "@/components/ui/alert";

const handlePrint = () => {
  window.print();
};

const handleDownloadPdf = () => {
  alert('Fonctionnalité de téléchargement PDF à implémenter');
};

export default function InterventionDetails() {
  const navigate = useNavigate();
  const {
    loading,
    demande,
    intervention,
    feedback,
    setFeedback,
    submitting,
    handleValidateIntervention,
    cancellingDemande,
    handleCancelDemande,
    materiels,
  } = useClientInterventionDetails();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  const showValidation = () => {
    return (
      intervention?.pv_intervention_id &&
      intervention?.statut === "terminée" &&
      intervention?.pv_interventions?.validation_client === null
    );
  };

  const canCancel = () => {
    return (
      demande &&
      ["en_attente", "validée", "en_cours_analyse"].includes(demande.statut)
    );
  };

  const confirmCancel = () => {
    setCancelDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">
              Chargement des détails de l'intervention...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Intervention non trouvée
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>
              L'intervention que vous recherchez n'existe pas ou vous n'avez pas
              les droits pour y accéder.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/client/interventions")}>
              Retour aux interventions
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 print:py-4 print:px-0">
      <div className="mb-8 print:mb-4 flex justify-between items-center">
        <div>
          <Button
            variant="outline"
            size="sm"
            className="mb-2 print:hidden"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">
            Détails de l'intervention #{demande.id.substring(0, 8).toUpperCase()}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <InterventionMainCard
            demande={demande}
            intervention={intervention}
            formatDate={formatDate}
            onPrint={handlePrint}
            onDownloadPdf={handleDownloadPdf}
            canCancel={canCancel()}
            renderCancelButton={() => (
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmCancel}
                disabled={cancellingDemande}
              >
                {cancellingDemande && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Annuler la demande
              </Button>
            )}
          >
            {/* Affichage du motif de refus si la demande a été rejetée */}
            {demande.statut === 'rejetée' && demande.motif_rejet && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Demande refusée</AlertTitle>
                <AlertDescription>
                  Motif du refus : {demande.motif_rejet}
                </AlertDescription>
              </Alert>
            )}

            {intervention && (
              <InterventionTeamsAndEquipment
                intervention={intervention}
                materiels={materiels}
              />
            )}

            {showValidation() && (
              <InterventionValidationCard
                feedback={feedback}
                setFeedback={setFeedback}
                submitting={submitting}
                onValidate={() => handleValidateIntervention(true)}
                onReject={() => handleValidateIntervention(false)}
                completed={
                  intervention?.pv_interventions?.validation_client === true
                }
              />
            )}
          </InterventionMainCard>
        </div>

        <div className="col-span-1 space-y-6 print:hidden">
          <InterventionRecapSidebar
            demande={demande}
            intervention={intervention}
            handlePrint={handlePrint}
            handleDownloadPdf={handleDownloadPdf}
            navigate={navigate}
          />
        </div>
      </div>

      <Toaster position="top-center" />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler cette demande d'intervention ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder la demande</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCancelDemande}
              disabled={cancellingDemande}
            >
              {cancellingDemande && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Oui, annuler la demande
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
