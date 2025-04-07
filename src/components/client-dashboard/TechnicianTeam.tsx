
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface TechnicianTeamProps {
  loading: boolean;
  techniciens: any[];
}

export const TechnicianTeam = ({ loading, techniciens }: TechnicianTeamProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Votre équipe technique</CardTitle>
        <CardDescription>
          Techniciens qui ont travaillé sur vos interventions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : techniciens.length === 0 ? (
          <div className="text-center py-4">
            <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucun technicien n'est encore assigné à vos interventions
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {techniciens.map((tech) => (
              <div key={tech.id} className="flex flex-col items-center text-center p-2 border rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium text-sm">{tech.nom}</h4>
                <p className="text-xs text-muted-foreground">Technicien</p>
                <div className={`h-2 w-2 rounded-full mt-1 ${tech.disponibilite ? "bg-green-500" : "bg-red-500"}`}></div>
              </div>
            ))}
          </div>
        )}
        {techniciens.length > 0 && (
          <div className="text-center mt-4">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-1" />
              Contacter l'équipe
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
