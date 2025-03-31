
import { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  CalendarClock,
  Clock,
  Users,
  Wrench,
  ClipboardList,
  Receipt,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingInterventions } from "@/components/dashboard/UpcomingInterventions";
import { dashboardService, interventionService } from "@/services/dataService";
import { DashboardStats } from "@/types/models";

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [upcomingInterventions, setUpcomingInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const statsData = await dashboardService.getStats();
        const activitiesData = await dashboardService.getRecentActivity();
        const interventionsData = await interventionService.getDetailedInterventions({
          status: "planifiée",
        });
        
        // Format interventions for the component
        const formattedInterventions = interventionsData
          .filter(interv => interv.dateDebut)
          .map(interv => ({
            id: interv.id,
            dateDebut: interv.dateDebut,
            localisation: interv.localisation,
            statut: interv.statut,
            clientNom: interv.client.nomEntreprise,
            description: interv.demande.description,
            equipe: interv.equipes.map((eq: any) => eq.nom).join(", ")
          }));

        setStats(statsData);
        setActivities(activitiesData);
        setUpcomingInterventions(formattedInterventions);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue sur le tableau de bord de gestion des interventions sous-marines.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Interventions actives"
          value={stats?.interventionsEnCours || 0}
          icon={<ClipboardList className="h-5 w-5" />}
          colorClass="text-blue-600"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Équipes disponibles"
          value={stats?.equipesDisponibles || 0}
          icon={<Users className="h-5 w-5" />}
          colorClass="text-green-600"
        />
        <StatCard
          title="Matériel disponible"
          value={stats?.materielsDisponibles || 0}
          icon={<Wrench className="h-5 w-5" />}
          colorClass="text-amber-600"
        />
        <StatCard
          title="Facturations en attente"
          value={stats?.facturationEnAttente || 0}
          icon={<Receipt className="h-5 w-5" />}
          colorClass="text-purple-600"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Interventions planifiées"
          value={stats?.interventionsPlanifiees || 0}
          icon={<CalendarClock className="h-5 w-5" />}
          colorClass="text-yellow-600"
        />
        <StatCard
          title="Interventions terminées"
          value={stats?.interventionsTerminees || 0}
          icon={<Clock className="h-5 w-5" />}
          colorClass="text-green-600"
          description="Ce mois-ci"
        />
        <StatCard
          title="Rapports générés"
          value={stats?.interventionsTerminees || 0}
          icon={<FileText className="h-5 w-5" />}
          colorClass="text-blue-600"
        />
        <StatCard
          title="CA Généré"
          value={`${Math.floor(
            (stats?.facturationPayee || 0) * 2800 + (stats?.facturationEnAttente || 0) * 1500
          ).toLocaleString('fr-FR')} €`}
          icon={<BarChart3 className="h-5 w-5" />}
          colorClass="text-emerald-600"
          description="Ce trimestre"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingInterventions interventions={upcomingInterventions} />
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
};

export default Dashboard;
