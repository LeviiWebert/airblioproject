
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";
import { AlertCircle, Printer, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InterventionMainCardProps {
  demande: any;
  intervention: any;
  formatDate: (date: string) => string;
  onPrint: () => void;
  onDownloadPdf: () => void;
  canCancel?: boolean;
  renderCancelButton?: () => React.ReactNode;
  children?: React.ReactNode;
}

export const InterventionMainCard = ({
  demande,
  intervention,
  formatDate,
  onPrint,
  onDownloadPdf,
  canCancel = false,
  renderCancelButton,
  children,
}: InterventionMainCardProps) => {
  return (
    <Card className="overflow-hidden print:shadow-none">
      <CardHeader className="bg-muted/40 print:bg-transparent">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="mb-1">
              Demande d'intervention #{demande.id.substring(0, 8).toUpperCase()}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <InterventionStatusBadge
                status={intervention?.statut || demande.statut}
              />
              <PriorityBadge priority={demande.urgence} />
              <span className="text-sm text-muted-foreground">
                Demande effectuée le {formatDate(demande.date_demande)}
              </span>
            </div>
          </div>
          <div className="print:hidden flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            <Button variant="outline" size="sm" onClick={onDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            {canCancel && renderCancelButton && renderCancelButton()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Affichage du motif de rejet si la demande a été refusée */}
          {demande.statut === 'rejetée' && demande.motif_rejet && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Demande refusée</AlertTitle>
              <AlertDescription>
                Motif du refus : {demande.motif_rejet}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="font-semibold text-lg mb-2">Description de la demande</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{demande.description}</p>
          </div>

          {intervention && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Date prévue</h3>
                  <p>
                    {intervention.date_debut
                      ? formatDate(intervention.date_debut)
                      : "Non planifiée"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Localisation</h3>
                  <p>{intervention.localisation}</p>
                </div>
              </div>
            </>
          )}
          {children}
        </div>
      </CardContent>
    </Card>
  );
};
