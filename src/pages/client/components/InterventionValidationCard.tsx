
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ValidationProps {
  intervention: any;
  feedback: string;
  setFeedback: (v: string) => void;
  submitting: boolean;
  handleValidate: (v: boolean) => void;
}

export const InterventionValidationCard = ({
  intervention,
  feedback,
  setFeedback,
  submitting,
  handleValidate
}: ValidationProps) => {
  if (!intervention) return null;
  if (intervention.statut !== "terminée") return null;
  // pv_interventions is loaded as part of intervention
  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Validation de l'intervention</CardTitle>
        <CardDescription>
          Veuillez valider l'intervention et apporter vos commentaires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm mb-2">Votre retour sur l'intervention:</p>
            <Textarea 
              placeholder="Commentaires ou observations sur l'intervention..." 
              className="min-h-[120px]"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={intervention.pv_interventions?.validation_client !== null}
            />
          </div>
          {intervention.pv_interventions?.validation_client === null ? (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={() => handleValidate(true)} 
                disabled={submitting}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Valider l'intervention
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleValidate(false)} 
                disabled={submitting}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Signaler un problème
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div className="flex items-center">
                {intervention.pv_interventions?.validation_client ? (
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <X className="h-5 w-5 text-red-500 mr-2" />
                )}
                <div>
                  <p className="font-medium">
                    {intervention.pv_interventions?.validation_client 
                      ? "Intervention validée" 
                      : "Problème signalé"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Le {format(
                      new Date(intervention.pv_interventions?.date_validation || ''),
                      "dd/MM/yyyy à HH:mm",
                      { locale: fr }
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
