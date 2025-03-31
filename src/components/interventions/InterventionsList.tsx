
import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InterventionStatusBadge } from "./InterventionStatusBadge";
import { PriorityBadge } from "./PriorityBadge";

interface Intervention {
  id: string;
  dateDebut: Date | null;
  dateFin: Date | null;
  localisation: string;
  statut: string;
  client: {
    nomEntreprise: string;
    id: string;
  };
  demande: {
    description: string;
    urgence: string;
  };
  equipes: {
    id: string;
    nom: string;
  }[];
}

interface InterventionsListProps {
  interventions: Intervention[];
  onStatusChange?: (id: string, newStatus: string) => void;
}

export const InterventionsList = ({ interventions, onStatusChange }: InterventionsListProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Intervention | "client.nomEntreprise" | "demande.urgence";
    direction: "asc" | "desc";
  }>({
    key: "dateDebut",
    direction: "desc",
  });

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig((currentConfig) => {
      if (currentConfig.key === key) {
        return {
          key,
          direction: currentConfig.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(date, "dd/MM/yyyy", { locale: fr });
  };

  const getValue = (intervention: any, key: string) => {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      return intervention[parent][child];
    }
    return intervention[key];
  };

  const sortedInterventions = [...interventions].sort((a, b) => {
    const aValue = getValue(a, sortConfig.key as string);
    const bValue = getValue(b, sortConfig.key as string);

    if (aValue === null) return sortConfig.direction === "asc" ? -1 : 1;
    if (bValue === null) return sortConfig.direction === "asc" ? 1 : -1;

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleStatusChangeClick = (id: string, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(id, newStatus);
    }
  };

  const renderSortIcon = (key: typeof sortConfig.key) => {
    if (sortConfig.key !== key) return null;
    
    return <ChevronDown 
      className={`h-4 w-4 inline ml-1 transform ${sortConfig.direction === "asc" ? "" : "rotate-180"}`} 
    />;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[100px] cursor-pointer"
              onClick={() => handleSort("dateDebut")}
            >
              Date {renderSortIcon("dateDebut")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("client.nomEntreprise")}
            >
              Client {renderSortIcon("client.nomEntreprise")}
            </TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("demande.urgence")}
            >
              Priorité {renderSortIcon("demande.urgence")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("statut")}
            >
              Statut {renderSortIcon("statut")}
            </TableHead>
            <TableHead className="hidden lg:table-cell">Équipe</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInterventions.length > 0 ? (
            sortedInterventions.map((intervention) => (
              <TableRow key={intervention.id}>
                <TableCell className="font-medium">
                  {formatDate(intervention.dateDebut)}
                </TableCell>
                <TableCell>{intervention.client.nomEntreprise}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {intervention.demande.description}
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={intervention.demande.urgence} />
                </TableCell>
                <TableCell>
                  <InterventionStatusBadge status={intervention.statut} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {intervention.equipes.length > 0 
                    ? intervention.equipes.map(eq => eq.nom).join(", ") 
                    : "-"
                  }
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Ouvrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to={`/interventions/${intervention.id}`}>
                          Voir les détails
                        </Link>
                      </DropdownMenuItem>
                      {intervention.statut !== "terminée" && intervention.statut !== "annulée" && (
                        <>
                          {intervention.statut === "planifiée" && (
                            <DropdownMenuItem onClick={() => handleStatusChangeClick(intervention.id, "en_cours")}>
                              Démarrer l'intervention
                            </DropdownMenuItem>
                          )}
                          {intervention.statut === "en_cours" && (
                            <DropdownMenuItem onClick={() => handleStatusChangeClick(intervention.id, "terminée")}>
                              Marquer comme terminée
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleStatusChangeClick(intervention.id, "annulée")}>
                            Annuler l'intervention
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to={`/interventions/${intervention.id}/edit`}>
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Aucune intervention trouvée.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
