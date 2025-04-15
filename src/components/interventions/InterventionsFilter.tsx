
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FilterOptions } from "@/types/models";

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
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  } | undefined>(undefined);

  const handleFilter = () => {
    const filters: FilterOptions = {};
    
    if (status) filters.status = status;
    if (client) filters.client = client;
    if (team) filters.team = team;
    if (dateRange) filters.dateRange = dateRange;
    
    onFilter(filters);
    setOpen(false); // Fermer le popover après application des filtres
  };

  const handleReset = () => {
    setStatus("");
    setClient("");
    setTeam("");
    setDateRange(undefined);
    onFilter({});
    setOpen(false); // Fermer le popover après réinitialisation
  };

  return (
    <div className="mb-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            <span>Filtrer</span>
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
                    <SelectItem value="">Tous les statuts</SelectItem>
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
                    <SelectItem value="">Tous les clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom_entreprise}
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
                    <SelectItem value="">Toutes les équipes</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.nom}
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
    </div>
  );
};
