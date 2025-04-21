
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ArrowLeft, Printer, Download, FileText } from "lucide-react";
import { SmallLoading } from "@/components/ui/loading";
import { InterventionMainCard } from "./components/InterventionMainCard";
import { InterventionTeamsAndEquipment } from "./components/InterventionTeamsAndEquipment";
import { InterventionValidationCard } from "./components/InterventionValidationCard";
import { InterventionRecapSidebar } from "./components/InterventionRecapSidebar";
import { useClientInterventionDetails } from "./hooks/useClientInterventionDetails";
import { formatDate, canCancelDemande, renderCancelButton } from "./utils/interventionHelpers";

const InterventionDetails = () => {
  const navigate = useNavigate();
  const {
    demande,
    intervention,
    loading,
    authChecked,
    feedback,
    setFeedback,
    submitting,
    handleValidateIntervention,
    cancellingDemande,
    handleCancelDemande,
    materiels,
  } = useClientInterventionDetails();

  const handlePrint = () => window.print();

  const handleDownloadPdf = () => {
    // TODO: Implement PDF logic or use toast/sonner for confirmation
    // Example: toast("Le récapitulatif de l'intervention a été téléchargé.");
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SmallLoading />
      </div>
    );
  }
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center">
          <SmallLoading />
        </div>
      </div>
    );
  }
  if (!demande) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Intervention non trouvée</h2>
            <p className="text-muted-foreground mb-4">
              Désolé, l'intervention que vous recherchez n'existe pas ou a été supprimée.
            </p>
            <Button onClick={() => navigate('/client/interventions')}>
              Retour à la liste des interventions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="print:hidden mb-8">
        <Button variant="outline" onClick={() => navigate('/client/interventions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste des interventions
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <InterventionMainCard
            demande={demande}
            intervention={intervention}
            formatDate={formatDate}
            onPrint={handlePrint}
            onDownloadPdf={handleDownloadPdf}
            canCancel={canCancelDemande(demande)}
            renderCancelButton={() => renderCancelButton(handleCancelDemande, cancellingDemande)}
          >
            {intervention && (
              <InterventionTeamsAndEquipment intervention={intervention} materiels={materiels} />
            )}
          </InterventionMainCard>
          <InterventionValidationCard
            intervention={intervention}
            feedback={feedback}
            setFeedback={setFeedback}
            submitting={submitting}
            handleValidate={handleValidateIntervention}
          />
        </div>
        <div className="space-y-6">
          <InterventionRecapSidebar
            demande={demande}
            intervention={intervention}
            handlePrint={handlePrint}
            handleDownloadPdf={handleDownloadPdf}
            navigate={navigate}
          />
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
              <Button variant="outline" className="w-full" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/client/pvs')}>
                <FileText className="mr-2 h-4 w-4" />
                Voir tous mes PVs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterventionDetails;
