
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InterventionStatusBadgeProps {
  status: string;
  className?: string;
}

export const InterventionStatusBadge = ({ status, className }: InterventionStatusBadgeProps) => {
  switch (status) {
    case "planifiée":
      return (
        <Badge variant="outline" className={cn("status-badge status-badge-pending", className)}>
          Planifiée
        </Badge>
      );
    case "en_cours":
      return (
        <Badge variant="outline" className={cn("status-badge status-badge-in-progress", className)}>
          En cours
        </Badge>
      );
    case "terminée":
      return (
        <Badge variant="outline" className={cn("status-badge status-badge-completed", className)}>
          Terminée
        </Badge>
      );
    case "annulée":
      return (
        <Badge variant="outline" className={cn("status-badge status-badge-canceled", className)}>
          Annulée
        </Badge>
      );
    case "en_attente":
      return (
        <Badge variant="outline" className={cn("status-badge status-badge-pending", className)}>
          En attente
        </Badge>
      );
    case "validée":
      return (
        <Badge variant="outline" className={cn("status-badge status-badge-completed", className)}>
          Validée
        </Badge>
      );
    case "rejetée":
      return (
        <Badge variant="outline" className={cn("status-badge status-badge-canceled", className)}>
          Rejetée
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
};
