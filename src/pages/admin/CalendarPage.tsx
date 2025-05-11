
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { interventionService } from "@/services/dataService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, Calendar as CalendarIcon, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Popover, 
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";

interface CalendarIntervention {
  date: Date;
  interventions: {
    id: string;
    title: string;
    client: string;
    status: string;
    url: string;
  }[];
}

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarInterventions, setCalendarInterventions] = useState<Record<string, CalendarIntervention>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Charger les interventions
  useEffect(() => {
    const loadInterventions = async () => {
      try {
        setLoading(true);
        const interventions = await interventionService.getDetailedInterventions();
        
        // Organiser les interventions par date
        const interventionsByDate: Record<string, CalendarIntervention> = {};
        
        interventions.forEach(intervention => {
          if (!intervention.dateDebut) return;
          
          const dateDebut = new Date(intervention.dateDebut);
          const dateKey = format(dateDebut, 'yyyy-MM-dd');
          
          if (!interventionsByDate[dateKey]) {
            interventionsByDate[dateKey] = {
              date: dateDebut,
              interventions: []
            };
          }
          
          interventionsByDate[dateKey].interventions.push({
            id: intervention.id,
            title: intervention.demande?.description || "Sans description",
            client: intervention.client?.nomEntreprise || "Client inconnu",
            status: intervention.statut,
            url: `/admin/intervention/${intervention.id}`
          });
        });
        
        setCalendarInterventions(interventionsByDate);
      } catch (error) {
        console.error("Erreur lors du chargement des interventions pour le calendrier:", error);
        setError("Impossible de charger les interventions");
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les interventions pour le calendrier"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadInterventions();
  }, [toast]);

  // Fonction pour vérifier si une date a des interventions
  const hasInterventions = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return dateKey in calendarInterventions;
  };
  
  // Fonction pour le rendu personnalisé des jours du calendrier
  const dayWithInterventions = (date: Date, interventions: boolean) => {
    if (!interventions) return null;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    const count = calendarInterventions[dateKey]?.interventions.length || 0;
    
    return (
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <Badge variant="secondary" className="text-xs px-1 rounded-sm">
          {count}
        </Badge>
      </div>
    );
  };
  
  // Afficher les interventions pour la date sélectionnée
  const selectedDateInterventions = selectedDate 
    ? calendarInterventions[format(selectedDate, 'yyyy-MM-dd')]?.interventions || []
    : [];

  const handleViewIntervention = (url: string) => {
    navigate(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendrier des interventions</h1>
        <p className="text-muted-foreground">
          Visualisez toutes les interventions planifiées sur le calendrier.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Calendrier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date || new Date())}
              className="rounded-md border shadow mx-auto"
              locale={fr}
              modifiers={{
                hasInterventions: (date) => hasInterventions(date),
              }}
              modifiersClassNames={{
                hasInterventions: "bg-blue-50 font-bold relative",
              }}
              components={{
                DayContent: ({ date }) => (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {date.getDate()}
                    {dayWithInterventions(date, hasInterventions(date))}
                  </div>
                ),
              }}
            />
          </CardContent>
        </Card>
        
        {/* Liste des interventions pour la date sélectionnée */}
        <Card>
          <CardHeader>
            <CardTitle>
              Interventions du {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: fr }) : "jour"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateInterventions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <Info className="h-10 w-10 mb-2" />
                <p>Aucune intervention planifiée pour cette date.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {selectedDateInterventions.map((intervention) => (
                  <li key={intervention.id} className="border rounded-lg p-3 hover:bg-muted/50">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium line-clamp-1">{intervention.title}</h3>
                      <Badge variant={intervention.status === 'terminée' ? 'secondary' : intervention.status === 'en_cours' ? 'default' : 'outline'}>
                        {intervention.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Client: {intervention.client}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-1"
                      onClick={() => handleViewIntervention(intervention.url)}
                    >
                      Voir les détails
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
