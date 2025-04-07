
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileText, CheckCircle, ExternalLink } from "lucide-react";

interface StatCardsProps {
  loading: boolean;
  pendingCount: number;
  activeCount: number;
  completedCount: number;
  rejectedCount: number;
}

export const StatCards = ({
  loading,
  pendingCount,
  activeCount,
  completedCount,
  rejectedCount
}: StatCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Demandes en attente
          </CardTitle>
          <CardDescription className="text-3xl font-bold">
            {loading ? "..." : pendingCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            En cours d'analyse ou validées
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Interventions actives
          </CardTitle>
          <CardDescription className="text-3xl font-bold">
            {loading ? "..." : activeCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-xs text-muted-foreground">
            <FileText className="h-4 w-4 mr-1" />
            En cours ou planifiées
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Interventions terminées
          </CardTitle>
          <CardDescription className="text-3xl font-bold">
            {loading ? "..." : completedCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-xs text-muted-foreground">
            <CheckCircle className="h-4 w-4 mr-1" />
            Complétées
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Demandes refusées
          </CardTitle>
          <CardDescription className="text-3xl font-bold">
            {loading ? "..." : rejectedCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-xs text-muted-foreground">
            <ExternalLink className="h-4 w-4 mr-1" />
            Non validées
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
