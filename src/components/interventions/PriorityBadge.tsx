
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
  switch (priority) {
    case "basse":
      return (
        <Badge variant="outline" className={cn("priority-badge priority-badge-low", className)}>
          Basse
        </Badge>
      );
    case "moyenne":
      return (
        <Badge variant="outline" className={cn("priority-badge priority-badge-medium", className)}>
          Moyenne
        </Badge>
      );
    case "haute":
      return (
        <Badge variant="outline" className={cn("priority-badge priority-badge-high", className)}>
          Haute
        </Badge>
      );
    case "critique":
      return (
        <Badge variant="outline" className={cn("priority-badge priority-badge-urgent", className)}>
          Critique
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {priority}
        </Badge>
      );
  }
};
