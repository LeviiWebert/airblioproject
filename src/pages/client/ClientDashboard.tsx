
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useClientInterventions } from "@/hooks/useClientInterventions";
import { StatCards } from "@/components/client-dashboard/StatCards";
import { RecentInterventions } from "@/components/client-dashboard/RecentInterventions";
import { TechnicianTeam } from "@/components/client-dashboard/TechnicianTeam";
import { QuickActions } from "@/components/client-dashboard/QuickActions";
import { InterventionTabs } from "@/components/client-dashboard/InterventionTabs";

const ClientDashboard = () => {
  const {
    loading,
    interventions,
    techniciens,
    clientData,
    getPendingInterventions,
    getActiveInterventions,
    getCompletedInterventions,
    getRejectedInterventions
  } = useClientInterventions();

  const pendingInterventions = getPendingInterventions();
  const activeInterventions = getActiveInterventions();
  const completedInterventions = getCompletedInterventions();
  const rejectedInterventions = getRejectedInterventions();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue dans votre espace client, {clientData?.nom_entreprise || "Client"}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/intervention/request">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle demande d'intervention
            </Button>
          </Link>
        </div>
      </div>

      <StatCards
        loading={loading}
        pendingCount={pendingInterventions.length}
        activeCount={activeInterventions.length}
        completedCount={completedInterventions.length}
        rejectedCount={rejectedInterventions.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <RecentInterventions
          loading={loading}
          interventions={interventions}
        />

        <TechnicianTeam
          loading={loading}
          techniciens={techniciens}
        />
      </div>

      <QuickActions />

      <InterventionTabs
        loading={loading}
        interventions={interventions}
        pendingInterventions={pendingInterventions}
        activeInterventions={activeInterventions}
        completedInterventions={completedInterventions}
      />
    </div>
  );
};

export default ClientDashboard;
