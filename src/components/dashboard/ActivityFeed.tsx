
import { Clock, User, Clipboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: string;
  date: Date;
  message: string;
  client: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed = ({ activities }: ActivityFeedProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "demande":
        return <Clipboard className="h-4 w-4 text-blue-500" />;
      case "intervention_debut":
      case "intervention_fin":
        return <Clock className="h-4 w-4 text-green-500" />;
      case "facturation":
        return <User className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Activités récentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex">
              <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {getActivityIcon(activity.type)}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{activity.message}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{activity.client}</span>
                  <span className="mx-1">•</span>
                  <time dateTime={activity.date.toISOString()}>
                    {format(activity.date, "d MMMM yyyy à HH:mm", { locale: fr })}
                  </time>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
