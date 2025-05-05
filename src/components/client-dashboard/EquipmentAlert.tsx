
import { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { baseService } from "@/services/supabaseService/baseService";
import { materielService } from "@/services/supabaseService/materielService";
import { useQuery } from "@tanstack/react-query";

export const EquipmentAlert = () => {
  const [expanded, setExpanded] = useState(false);

  const { data: bases, isLoading: basesLoading } = useQuery({
    queryKey: ["bases"],
    queryFn: baseService.getAll
  });

  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: materielService.getAll
  });

  const loading = basesLoading || equipmentLoading;

  if (loading) {
    return (
      <Alert className="bg-blue-50 border-blue-100 mb-6">
        <div className="flex items-center">
          <Wrench className="h-4 w-4 mr-2 text-blue-500" />
          <AlertTitle>Chargement des équipements...</AlertTitle>
        </div>
      </Alert>
    );
  }

  if (!equipment || equipment.length === 0) {
    return null;
  }

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const basesWithEquipment = bases?.filter(base => 
    equipment.some(item => item.base_id === base.id)
  ) || [];

  const equipmentByBase = basesWithEquipment.map(base => {
    const baseEquipment = equipment.filter(item => item.base_id === base.id);
    return {
      base,
      equipment: baseEquipment
    };
  });

  return (
    <Alert className="bg-blue-50 border-blue-100 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <Wrench className="h-4 w-4 mr-2 text-blue-500" />
          <AlertTitle>Équipements disponibles</AlertTitle>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-blue-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-500" />
        )}
      </div>

      {expanded && (
        <div className="mt-2">
          <AlertDescription>
            <p className="mb-2 text-sm text-muted-foreground">
              Consultez notre flotte d'équipements spécialisés disponibles dans nos bases opérationnelles.
            </p>
            
            <div className="space-y-3 mt-3">
              {equipmentByBase.map(({ base, equipment }) => (
                <div key={base.id} className="bg-white p-3 rounded-md border border-blue-100">
                  <h4 className="font-medium text-sm">{base.nom}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{base.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {equipment.map(item => (
                      <Badge 
                        key={item.id} 
                        variant="outline" 
                        className="bg-blue-50 text-xs hover:bg-blue-100"
                      >
                        {item.reference} - {item.type_materiel}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </div>
      )}
    </Alert>
  );
};
