
import { useToast } from "@/hooks/use-toast";
import { useInterventionRequests } from "@/hooks/useInterventionRequests";
import { InterventionRequestsTable } from "@/components/interventions/InterventionRequestsTable";
import { ConfirmationDialog } from "@/components/interventions/ConfirmationDialog";

const InterventionRequests = () => {
  const { loading, requests, selectedRequest, dialogOpen, actionType, setDialogOpen, handleAccept, handleReject, confirmAction } = useInterventionRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demandes d'intervention</h1>
        <p className="text-muted-foreground">
          Gérez les nouvelles demandes d'intervention reçues.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des demandes...</p>
          </div>
        </div>
      ) : (
        <InterventionRequestsTable 
          requests={requests} 
          onAccept={handleAccept} 
          onReject={handleReject}
        />
      )}

      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedRequest={selectedRequest}
        actionType={actionType}
        onConfirm={confirmAction}
      />
    </div>
  );
};

export default InterventionRequests;
