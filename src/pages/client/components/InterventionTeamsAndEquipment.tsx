
import { Separator } from "@/components/ui/separator";
import { Users, User, Wrench, Package, FileText } from "lucide-react";

interface Props {
  intervention: any;
  materiels: any[];
}

export const InterventionTeamsAndEquipment = ({ intervention, materiels }: Props) => (
  <>
    <Separator className="my-6" />
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Informations générales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-start">
          <span className="w-5 h-5 mr-2 text-muted-foreground mt-0.5">&#128336;</span>
          <div>
            <p className="font-medium">Date de début</p>
            <p className="text-muted-foreground">
              {intervention.date_debut ? new Date(intervention.date_debut).toLocaleString("fr-FR") : "Non définie"}
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <span className="w-5 h-5 mr-2 text-muted-foreground mt-0.5">&#128197;</span>
          <div>
            <p className="font-medium">Date de fin</p>
            <p className="text-muted-foreground">
              {intervention.date_fin ? new Date(intervention.date_fin).toLocaleString("fr-FR") : "Non définie"}
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <span className="w-5 h-5 mr-2 text-muted-foreground mt-0.5">&#128205;</span>
          <div>
            <p className="font-medium">Localisation</p>
            <p className="text-muted-foreground">
              {intervention.localisation || "Non spécifiée"}
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <FileText className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Statut de l'intervention</p>
            <div className="mt-1">{/* Status badge à inclure si besoin */}</div>
          </div>
        </div>
      </div>
      {/* Équipe & Matériel */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Équipe & Matériel</h3>
        {/* Équipes assignées */}
        {intervention.intervention_equipes && 
        intervention.intervention_equipes.length > 0 ? (
          <div className="mb-6">
            <h4 className="font-medium mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              Équipe(s) technique(s)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {intervention.intervention_equipes.map((item: any) => (
                <div key={item.equipe_id} className="flex items-center border rounded-md p-3">
                  <User className="w-8 h-8 text-primary mr-3" />
                  <div>
                    <p className="font-medium">{item.equipes?.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.equipes?.specialisation || "Équipe technique"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 border border-dashed rounded-md text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucune équipe n'a encore été assignée à cette intervention</p>
          </div>
        )}
        {/* Matériel utilisé */}
        {materiels && materiels.length > 0 ? (
          <div className="mt-6">
            <h4 className="font-medium mb-2 flex items-center">
              <Wrench className="w-4 h-4 mr-2 text-muted-foreground" />
              Matériel utilisé
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {materiels.map((item) => (
                <div key={item.materiel_id} className="flex items-center border rounded-md p-3">
                  <Package className="w-8 h-8 text-primary mr-3" />
                  <div>
                    <p className="font-medium">{item.materiels?.type_materiel}</p>
                    <p className="text-xs">Réf: {item.materiels?.reference}</p>
                    {item.materiels?.etat && (
                      <p className="text-xs text-muted-foreground">
                        État: {item.materiels.etat}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 border border-dashed rounded-md text-center text-muted-foreground">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucun matériel n'a encore été assigné à cette intervention</p>
          </div>
        )}
      </div>
      {intervention.rapport && (
        <div className="mt-8">
          <h4 className="font-medium mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
            Rapport d'intervention
          </h4>
          <div className="bg-muted p-4 rounded-md">
            <p className="whitespace-pre-line">{intervention.rapport}</p>
          </div>
        </div>
      )}
    </div>
  </>
);
