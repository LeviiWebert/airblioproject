
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { MessageSquare, FileText, Printer, Download } from "lucide-react";

interface RecapSidebarProps {
  demande: any;
  intervention: any;
  handlePrint: () => void;
  handleDownloadPdf: () => void;
  navigate: (to: string) => void;
}

export const InterventionRecapSidebar = ({
  demande,
  intervention,
  handlePrint,
  handleDownloadPdf,
  navigate,
}: RecapSidebarProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Récapitulatif</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <p className="text-sm font-medium">Numéro d'intervention</p>
        <p className="text-lg">#{demande.id.substring(0, 8).toUpperCase()}</p>
      </div>
      <Separator />
      <div>
        <p className="text-sm font-medium">Date de la demande</p>
        <p>{format(new Date(demande.date_demande), "dd/MM/yyyy", { locale: fr })}</p>
      </div>
      <Separator />
      <div>
        <p className="text-sm font-medium">Niveau d'urgence</p>
        <div className="mt-1">
          <PriorityBadge priority={demande.urgence} />
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-sm font-medium">Statut actuel</p>
        <div className="mt-1">
          {intervention ? (
            <InterventionStatusBadge status={intervention.statut} />
          ) : (
            <InterventionStatusBadge status={demande.statut} />
          )}
        </div>
      </div>
      {intervention && intervention.date_debut && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium">Date programmée</p>
            <p>{format(new Date(intervention.date_debut), "dd/MM/yyyy", { locale: fr })}</p>
          </div>
        </>
      )}
    </CardContent>
    <CardFooter className="flex flex-col gap-3">
      <Button variant="outline" className="w-full" asChild>
        <a href={`mailto:support@gestint.com?subject=Question sur l'intervention #${demande.id.substring(0, 8).toUpperCase()}`}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Contacter le support
        </a>
      </Button>
      {intervention && intervention.pv_intervention_id && (
        <Button className="w-full" onClick={() => navigate(`/client/pv/${intervention.pv_intervention_id}`)}>
          <FileText className="mr-2 h-4 w-4" />
          Voir le PV d'intervention
        </Button>
      )}
    </CardFooter>
  </Card>
);
