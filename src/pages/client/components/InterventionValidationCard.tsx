
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface ValidationProps {
  feedback: string;
  setFeedback: (v: string) => void;
  submitting: boolean;
  handleValidate: (v: boolean) => void;
  completed?: boolean;
}

export const InterventionValidationCard = ({
  feedback,
  setFeedback,
  submitting,
  handleValidate,
  completed
}: ValidationProps) => {
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
              disabled={completed !== undefined}
            />
          </div>
          {completed === undefined ? (
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
                {completed ? (
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <X className="h-5 w-5 text-red-500 mr-2" />
                )}
                <div>
                  <p className="font-medium">
                    {completed 
                      ? "Intervention validée" 
                      : "Problème signalé"
                    }
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
