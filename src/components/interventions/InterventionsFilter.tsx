
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FilterIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FilterOptions } from "@/types/models";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";

interface InterventionsFilterProps {
  clients: any[];
  teams: any[];
  onFilter: (filters: FilterOptions) => void;
}

export const InterventionsFilter = ({ clients, teams, onFilter }: InterventionsFilterProps) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [client, setClient] = useState<string>("");
  const [team, setTeam] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters whenever they change
  useEffect(() => {
    let count = 0;
    if (status) count++;
    if (client) count++;
    if (team) count++;
    if (dateRange?.from) count++;
    
    setActiveFiltersCount(count);
  }, [status, client, team, dateRange]);

  const handleFilter = () => {
    const filters: FilterOptions = {};
    
    if (status) filters.status = status;
    if (client) filters.client = client;
    if (team) filters.team = team;
    if (dateRange) filters.dateRange = dateRange;
    
    console.log("Sending filters to parent:", filters);
    onFilter(filters);
    setOpen(false);
  };

  const handleReset = () => {
    setStatus("");
    setClient("");
    setTeam("");
    setDateRange(undefined);
    onFilter({});
    setOpen(false);
  };

  // Find names for selected options (for display in badges)
  const getClientName = () => {
    const selectedClient = clients.find(c => c.id === client);
    return selectedClient ? selectedClient.nom_entreprise : "";
  };

  const getTeamName = () => {
    const selectedTeam = teams.find(t => t.id === team);
    return selectedTeam ? selectedTeam.nom : "";
  };

  const getStatusLabel = () => {
    const statusMap: Record<string, string> = {
      "en_attente": "En attente",
      "validée": "Validée",
      "planifiée": "Planifiée",
      "en_cours": "En cours",
      "terminée": "Terminée",
      "annulée": "Annulée"
    };
    return statusMap[status] || status;
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4" />
              <span>Filtrer</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Statut</h3>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="validée">Validée</SelectItem>
                      <SelectItem value="planifiée">Planifiée</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="terminée">Terminée</SelectItem>
                      <SelectItem value="annulée">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Client</h3>
                  <Select value={client} onValueChange={setClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les clients</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom_entreprise}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Équipe</h3>
                  <Select value={team} onValueChange={setTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les équipes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les équipes</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Période</h3>
                  <DateRangePicker date={dateRange} setDate={setDateRange} />
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handleReset}>
                    Réinitialiser
                  </Button>
                  <Button onClick={handleFilter}>
                    Appliquer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Active filter badges */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {status && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {getStatusLabel()}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setStatus("");
                    onFilter({ ...client ? { client } : {}, ...team ? { team } : {}, ...dateRange ? { dateRange } : {} });
                  }} 
                />
              </Badge>
            )}
            
            {client && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {getClientName()}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setClient("");
                    onFilter({ ...status ? { status } : {}, ...team ? { team } : {}, ...dateRange ? { dateRange } : {} });
                  }} 
                />
              </Badge>
            )}
            
            {team && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {getTeamName()}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setTeam("");
                    onFilter({ ...status ? { status } : {}, ...client ? { client } : {}, ...dateRange ? { dateRange } : {} });
                  }} 
                />
              </Badge>
            )}
            
            {dateRange?.from && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {dateRange.from.toLocaleDateString()} 
                {dateRange.to && ` - ${dateRange.to.toLocaleDateString()}`}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setDateRange(undefined);
                    onFilter({ ...status ? { status } : {}, ...client ? { client } : {}, ...team ? { team } : {} });
                  }} 
                />
              </Badge>
            )}
            
            {activeFiltersCount > 1 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs" 
                onClick={handleReset}
              >
                Effacer tout
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
