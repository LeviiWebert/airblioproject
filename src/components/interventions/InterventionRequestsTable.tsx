
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { toast } from "sonner";

interface InterventionRequestsTableProps {
  requests: any[];
  onAccept: (request: any) => void;
  onReject: (request: any) => void;
  disabled?: boolean;
}

export const InterventionRequestsTable = ({ 
  requests, 
  onAccept, 
  onReject,
  disabled = false
}: InterventionRequestsTableProps) => {
  // Handler to prevent accidental double-clicks
  const handleAccept = (request: any) => {
    // Check if the request is not already being processed
    if (request.statut !== 'en_attente') {
      toast.error("Cette demande a déjà été traitée");
      return;
    }
    if (disabled) {
      toast.info("Veuillez patienter, une action est en cours");
      return;
    }
    onAccept(request);
  };

  const handleReject = (request: any) => {
    // Check if the request is not already being processed
    if (request.statut !== 'en_attente') {
      toast.error("Cette demande a déjà été traitée");
      return;
    }
    if (disabled) {
      toast.info("Veuillez patienter, une action est en cours");
      return;
    }
    onReject(request);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead>Urgence</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {format(new Date(request.date_demande), "dd/MM/yyyy", { locale: fr })}
                </TableCell>
                <TableCell>{request.client?.nom_entreprise || 'Client inconnu'}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                  {request.description}
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={request.urgence} />
                </TableCell>
                <TableCell>
                  <InterventionStatusBadge status={request.statut} />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    className="border-green-500 hover:bg-green-500 hover:text-white text-green-500"
                    onClick={() => handleAccept(request)}
                    disabled={request.statut !== 'en_attente' || disabled}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Accepter
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-red-500 hover:bg-red-500 hover:text-white text-red-500"
                    onClick={() => handleReject(request)}
                    disabled={request.statut !== 'en_attente' || disabled}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Refuser
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Aucune demande d'intervention en attente.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
