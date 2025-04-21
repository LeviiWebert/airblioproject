
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Info, ArrowLeft, Printer, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterventionStatusBadge } from "@/components/interventions/InterventionStatusBadge";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";

interface MainCardProps {
  demande: any;
  intervention: any;
  formatDate: (d: string | null) => string;
  onPrint: () => void;
  onDownloadPdf: () => void;
  canCancel: boolean;
  renderCancelButton: () => React.ReactNode;
  children?: React.ReactNode;
}

export const InterventionMainCard = ({
  demande,
  intervention,
  formatDate,
  onPrint,
  onDownloadPdf,
  canCancel,
  renderCancelButton,
  children
}: MainCardProps) => (
  <Card id="intervention-details" className="print:shadow-none">
    <CardHeader className="print:pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>
            Récapitulatif d'intervention #{demande.id.substring(0, 8).toUpperCase()}
          </CardTitle>
          <CardDescription>
            Demande du {format(new Date(demande.date_demande), "dd MMMM yyyy", { locale: fr })}
          </CardDescription>
        </div>
        <div className="mt-4 md:mt-0 print:hidden">
          <Button variant="outline" size="sm" className="mr-2" onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button size="sm" onClick={onDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Statut de la demande</h3>
        <div className="flex flex-wrap gap-2">
          <InterventionStatusBadge status={demande.statut} className="text-base" />
          <PriorityBadge priority={demande.urgence} className="text-base" />
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Description de la demande</h3>
        <div className="bg-muted p-4 rounded-md">
          <p>{demande.description}</p>
        </div>
      </div>
      {children}
      {canCancel && (
        <div className="mt-8 print:hidden">
          {renderCancelButton()}
        </div>
      )}
    </CardContent>
  </Card>
);
