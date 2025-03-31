
import { 
  clients, utilisateurs, equipes, materiels,
  demandesIntervention, interventions, pvInterventions, 
  facturations, suiviEquipes, suiviMateriels, dashboardStats
} from './mockData';

import { 
  Client, Utilisateur, Equipe, Materiel,
  DemandeIntervention, Intervention, PVIntervention,
  Facturation, SuiviEquipe, SuiviMateriel, DashboardStats,
  FilterOptions
} from '@/types/models';

// Simuler un délai réseau
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Service de clients
export const clientService = {
  getAll: async (): Promise<Client[]> => {
    await delay(300);
    return [...clients];
  },
  
  getById: async (id: string): Promise<Client | undefined> => {
    await delay(200);
    return clients.find(client => client.id === id);
  }
};

// Service d'utilisateurs
export const utilisateurService = {
  getAll: async (): Promise<Utilisateur[]> => {
    await delay(300);
    return [...utilisateurs];
  },
  
  getById: async (id: string): Promise<Utilisateur | undefined> => {
    await delay(200);
    return utilisateurs.find(utilisateur => utilisateur.id === id);
  },
  
  getTechniciens: async (): Promise<Utilisateur[]> => {
    await delay(300);
    return utilisateurs.filter(u => u.role === 'technicien');
  }
};

// Service d'équipes
export const equipeService = {
  getAll: async (): Promise<Equipe[]> => {
    await delay(300);
    return [...equipes];
  },
  
  getById: async (id: string): Promise<Equipe | undefined> => {
    await delay(200);
    return equipes.find(equipe => equipe.id === id);
  },
  
  getWithMembres: async (): Promise<(Equipe & { membresDetails: Utilisateur[] })[]> => {
    await delay(500);
    return equipes.map(equipe => ({
      ...equipe,
      membresDetails: utilisateurs.filter(u => equipe.membres.includes(u.id))
    }));
  }
};

// Service de matériel
export const materielService = {
  getAll: async (): Promise<Materiel[]> => {
    await delay(300);
    return [...materiels];
  },
  
  getById: async (id: string): Promise<Materiel | undefined> => {
    await delay(200);
    return materiels.find(materiel => materiel.id === id);
  },
  
  getByStatus: async (status: Materiel['etat']): Promise<Materiel[]> => {
    await delay(300);
    return materiels.filter(m => m.etat === status);
  }
};

// Service de demandes d'intervention
export const demandeInterventionService = {
  getAll: async (): Promise<DemandeIntervention[]> => {
    await delay(300);
    return [...demandesIntervention];
  },
  
  getById: async (id: string): Promise<DemandeIntervention | undefined> => {
    await delay(200);
    return demandesIntervention.find(demande => demande.id === id);
  },
  
  getByStatus: async (status: DemandeIntervention['statut']): Promise<DemandeIntervention[]> => {
    await delay(300);
    return demandesIntervention.filter(d => d.statut === status);
  },
  
  getWithClientDetails: async (): Promise<(DemandeIntervention & { client: Client })[]> => {
    await delay(500);
    return demandesIntervention.map(demande => {
      const client = clients.find(c => c.id === demande.clientId);
      return {
        ...demande,
        client: client!
      };
    });
  }
};

// Service d'interventions
export const interventionService = {
  getAll: async (): Promise<Intervention[]> => {
    await delay(300);
    return [...interventions];
  },
  
  getById: async (id: string): Promise<Intervention | undefined> => {
    await delay(200);
    return interventions.find(intervention => intervention.id === id);
  },
  
  getByStatus: async (status: Intervention['statut']): Promise<Intervention[]> => {
    await delay(300);
    return interventions.filter(i => i.statut === status);
  },
  
  getDetailedInterventions: async (options?: FilterOptions): Promise<any[]> => {
    await delay(500);
    
    let filteredInterventions = [...interventions];
    
    // Appliquer les filtres si fournis
    if (options) {
      if (options.status) {
        filteredInterventions = filteredInterventions.filter(i => i.statut === options.status);
      }
      
      if (options.client) {
        const clientDemandeIds = demandesIntervention
          .filter(d => d.clientId === options.client)
          .map(d => d.id);
          
        filteredInterventions = filteredInterventions.filter(i => 
          clientDemandeIds.includes(i.demandeInterventionId)
        );
      }
      
      if (options.team) {
        filteredInterventions = filteredInterventions.filter(i => 
          i.equipesIds.includes(options.team!)
        );
      }
      
      if (options.dateRange && options.dateRange.from) {
        filteredInterventions = filteredInterventions.filter(i => 
          i.dateDebut && new Date(i.dateDebut) >= options.dateRange!.from!
        );
      }
      
      if (options.dateRange && options.dateRange.to) {
        filteredInterventions = filteredInterventions.filter(i => 
          i.dateDebut && new Date(i.dateDebut) <= options.dateRange!.to!
        );
      }
    }
    
    // Enrichir les données avec détails liés
    return filteredInterventions.map(intervention => {
      const demande = demandesIntervention.find(d => d.id === intervention.demandeInterventionId)!;
      const client = clients.find(c => c.id === demande.clientId)!;
      const equipes = intervention.equipesIds.map(eqId => 
        equipes.find(eq => eq.id === eqId)!
      );
      const materiels = intervention.materielsIds.map(matId => 
        materiels.find(mat => mat.id === matId)!
      );
      
      return {
        ...intervention,
        demande,
        client,
        equipes,
        materiels,
        facturation: intervention.facturationId ? 
          facturations.find(f => f.id === intervention.facturationId) : undefined,
        pvIntervention: intervention.pvInterventionId ?
          pvInterventions.find(pv => pv.id === intervention.pvInterventionId) : undefined
      };
    });
  }
};

// Service PV d'interventions
export const pvInterventionService = {
  getAll: async (): Promise<PVIntervention[]> => {
    await delay(300);
    return [...pvInterventions];
  },
  
  getById: async (id: string): Promise<PVIntervention | undefined> => {
    await delay(200);
    return pvInterventions.find(pv => pv.id === id);
  }
};

// Service de facturations
export const facturationService = {
  getAll: async (): Promise<Facturation[]> => {
    await delay(300);
    return [...facturations];
  },
  
  getById: async (id: string): Promise<Facturation | undefined> => {
    await delay(200);
    return facturations.find(facturation => facturation.id === id);
  },
  
  getByStatus: async (status: Facturation['statutPaiement']): Promise<Facturation[]> => {
    await delay(300);
    return facturations.filter(f => f.statutPaiement === status);
  },
  
  getWithInterventionDetails: async (): Promise<any[]> => {
    await delay(500);
    return facturations.map(facturation => {
      const intervention = interventions.find(i => i.id === facturation.interventionId)!;
      const demande = demandesIntervention.find(d => d.id === intervention.demandeInterventionId)!;
      const client = clients.find(c => c.id === demande.clientId)!;
      
      return {
        ...facturation,
        intervention,
        demande,
        client
      };
    });
  }
};

// Service de suivi des équipes
export const suiviEquipeService = {
  getAll: async (): Promise<SuiviEquipe[]> => {
    await delay(300);
    return [...suiviEquipes];
  },
  
  getById: async (id: string): Promise<SuiviEquipe | undefined> => {
    await delay(200);
    return suiviEquipes.find(suivi => suivi.id === id);
  },
  
  getActiveByEquipe: async (equipeId: string): Promise<SuiviEquipe[]> => {
    await delay(300);
    return suiviEquipes.filter(s => s.equipeId === equipeId && s.dateFin === null);
  }
};

// Service de suivi du matériel
export const suiviMaterielService = {
  getAll: async (): Promise<SuiviMateriel[]> => {
    await delay(300);
    return [...suiviMateriels];
  },
  
  getById: async (id: string): Promise<SuiviMateriel | undefined> => {
    await delay(200);
    return suiviMateriels.find(suivi => suivi.id === id);
  },
  
  getByMateriel: async (materielId: string): Promise<SuiviMateriel[]> => {
    await delay(300);
    return suiviMateriels.filter(s => s.materielId === materielId);
  }
};

// Service de statistiques du tableau de bord
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    await delay(500);
    return { ...dashboardStats };
  },
  
  getRecentActivity: async (): Promise<any[]> => {
    await delay(500);
    
    // Combiner les différentes activités et les trier par date
    const activities = [
      ...demandesIntervention.map(d => ({
        type: 'demande',
        date: d.dateDemande,
        entity: d,
        client: clients.find(c => c.id === d.clientId)!.nomEntreprise,
        message: `Nouvelle demande: ${d.description}`
      })),
      ...interventions
        .filter(i => i.dateDebut)
        .map(i => ({
          type: 'intervention_debut',
          date: i.dateDebut!,
          entity: i,
          client: clients.find(c => c.id === demandesIntervention.find(d => d.id === i.demandeInterventionId)!.clientId)!.nomEntreprise,
          message: `Début d'intervention à ${i.localisation}`
        })),
      ...interventions
        .filter(i => i.dateFin)
        .map(i => ({
          type: 'intervention_fin',
          date: i.dateFin!,
          entity: i,
          client: clients.find(c => c.id === demandesIntervention.find(d => d.id === i.demandeInterventionId)!.clientId)!.nomEntreprise,
          message: `Fin d'intervention à ${i.localisation}`
        })),
      ...facturations.map(f => ({
        type: 'facturation',
        date: f.dateFacturation,
        entity: f,
        client: clients.find(c => c.id === demandesIntervention.find(d => d.id === interventions.find(i => i.id === f.interventionId)!.demandeInterventionId)!.clientId)!.nomEntreprise,
        message: `Facturation de ${f.montantTotal}€ (${f.statutPaiement})`
      }))
    ];
    
    // Trier par date décroissante (plus récent en premier)
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Limiter aux 10 dernières activités
  }
};
