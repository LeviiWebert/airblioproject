
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterOptions } from "@/types/models";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InterventionsFilterProps {
  clients: { id: string; nomEntreprise: string }[];
  teams: { id: string; nom: string }[];
  onFilter: (filters: FilterOptions) => void;
}

export const InterventionsFilter = ({ clients, teams, onFilter }: InterventionsFilterProps) => {
  const [filters, setFilters] = useState<FilterOptions>({
    status: undefined,
    priority: undefined,
    dateRange: {
      from: null,
      to: null,
    },
    client: undefined,
    team: undefined,
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (value: string) => {
    setFilters({
      ...filters,
      status: value,
    });
  };

  const handlePriorityChange = (value: string) => {
    setFilters({
      ...filters,
      priority: value,
    });
  };

  const handleClientChange = (value: string) => {
    setFilters({
      ...filters,
      client: value,
    });
  };

  const handleTeamChange = (value: string) => {
    setFilters({
      ...filters,
      team: value,
    });
  };

  const handleDateRangeChange = (range: { from: Date | null; to: Date | null }) => {
    setFilters({
      ...filters,
      dateRange: range,
    });
  };

  const handleReset = () => {
    setFilters({
      status: undefined,
      priority: undefined,
      dateRange: {
        from: null,
        to: null,
      },
      client: undefined,
      team: undefined,
    });
    onFilter({});
  };

  const handleApply = () => {
    onFilter(filters);
    setIsOpen(false);
  };

  const statusOptions = [
    { value: "planifiée", label: "Planifiée" },
    { value: "en_cours", label: "En cours" },
    { value: "terminée", label: "Terminée" },
    { value: "annulée", label: "Annulée" },
  ];

  const priorityOptions = [
    { value: "basse", label: "Basse" },
    { value: "moyenne", label: "Moyenne" },
    { value: "haute", label: "Haute" },
    { value: "critique", label: "Critique" },
  ];

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px] p-4" align="start">
            <div className="space-y-4">
              <h3 className="font-medium">Filtres</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select value={filters.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les statuts</SelectItem>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Priorité</label>
                <Select value={filters.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les priorités</SelectItem>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <Select value={filters.client} onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nomEntreprise}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Équipe</label>
                <Select value={filters.team} onValueChange={handleTeamChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les équipes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les équipes</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Période</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange?.from ? (
                          format(filters.dateRange.from, "dd/MM/yyyy")
                        ) : (
                          "Date début"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.from || undefined}
                        onSelect={(date) =>
                          handleDateRangeChange({
                            from: date,
                            to: filters.dateRange?.to || null,
                          })
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange?.to ? (
                          format(filters.dateRange.to, "dd/MM/yyyy")
                        ) : (
                          "Date fin"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.to || undefined}
                        onSelect={(date) =>
                          handleDateRangeChange({
                            from: filters.dateRange?.from || null,
                            to: date,
                          })
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleReset}>
                  Réinitialiser
                </Button>
                <Button onClick={handleApply}>Appliquer</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="flex-1">
          <Input placeholder="Rechercher..." className="w-full" />
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {filters.status && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Statut: {filters.status}
            <X className="h-3 w-3 cursor-pointer" onClick={() => {
              setFilters({ ...filters, status: undefined });
              onFilter({ ...filters, status: undefined });
            }} />
          </Badge>
        )}
        
        {filters.priority && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Priorité: {filters.priority}
            <X className="h-3 w-3 cursor-pointer" onClick={() => {
              setFilters({ ...filters, priority: undefined });
              onFilter({ ...filters, priority: undefined });
            }} />
          </Badge>
        )}
        
        {filters.client && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Client: {clients.find(c => c.id === filters.client)?.nomEntreprise}
            <X className="h-3 w-3 cursor-pointer" onClick={() => {
              setFilters({ ...filters, client: undefined });
              onFilter({ ...filters, client: undefined });
            }} />
          </Badge>
        )}
        
        {filters.team && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Équipe: {teams.find(t => t.id === filters.team)?.nom}
            <X className="h-3 w-3 cursor-pointer" onClick={() => {
              setFilters({ ...filters, team: undefined });
              onFilter({ ...filters, team: undefined });
            }} />
          </Badge>
        )}
        
        {filters.dateRange?.from && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Du: {format(filters.dateRange.from, "dd/MM/yyyy", { locale: fr })}
            <X className="h-3 w-3 cursor-pointer" onClick={() => {
              const newDateRange = { ...filters.dateRange, from: null };
              setFilters({ ...filters, dateRange: newDateRange });
              onFilter({ ...filters, dateRange: newDateRange });
            }} />
          </Badge>
        )}
        
        {filters.dateRange?.to && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Au: {format(filters.dateRange.to, "dd/MM/yyyy", { locale: fr })}
            <X className="h-3 w-3 cursor-pointer" onClick={() => {
              const newDateRange = { ...filters.dateRange, to: null };
              setFilters({ ...filters, dateRange: newDateRange });
              onFilter({ ...filters, dateRange: newDateRange });
            }} />
          </Badge>
        )}
        
        {(filters.status || filters.priority || filters.client || filters.team || 
         filters.dateRange?.from || filters.dateRange?.to) && (
          <Button variant="ghost" className="h-7 px-3 text-xs" onClick={handleReset}>
            Effacer tous les filtres
          </Button>
        )}
      </div>
    </div>
  );
};
