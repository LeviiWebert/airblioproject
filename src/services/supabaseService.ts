
import { supabase } from '@/integrations/supabase/client';
import type { 
  Client, Utilisateur, Equipe, Materiel,
  DemandeIntervention, Intervention, PVIntervention,
  Facturation, SuiviEquipe, SuiviMateriel, DashboardStats,
  FilterOptions
} from '@/types/models';

// Service de clients
export const clientService = {
  getAll: async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*');

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return data.map(client => ({
      id: client.id,
      nomEntreprise: client.nom_entreprise,
      tel: client.tel || '',
      email: client.email || '',
      identifiant: client.identifiant || '',
      mdp: client.mdp || ''
    }));
  },
  
  getById: async (id: string): Promise<Client | undefined> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching client by id:', error);
      throw error;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      nomEntreprise: data.nom_entreprise,
      tel: data.tel || '',
      email: data.email || '',
      identifiant: data.identifiant || '',
      mdp: data.mdp || ''
    };
  }
};

// Service d'utilisateurs
export const utilisateurService = {
  getAll: async (): Promise<Utilisateur[]> => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*');

    if (error) {
      console.error('Error fetching utilisateurs:', error);
      throw error;
    }

    return data.map(user => ({
      id: user.id,
      nom: user.nom,
      role: user.role as "technicien" | "responsable" | "admin",
      email: user.email || '',
      disponibilite: user.disponibilite,
      identifiant: user.identifiant || '',
      mdp: user.mdp || ''
    }));
  },
  
  getById: async (id: string): Promise<Utilisateur | undefined> => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching utilisateur by id:', error);
      throw error;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      nom: data.nom,
      role: data.role as "technicien" | "responsable" | "admin",
      email: data.email || '',
      disponibilite: data.disponibilite,
      identifiant: data.identifiant || '',
      mdp: data.mdp || ''
    };
  },
  
  getTechniciens: async (): Promise<Utilisateur[]> => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('role', 'technicien');

    if (error) {
      console.error('Error fetching techniciens:', error);
      throw error;
    }

    return data.map(user => ({
      id: user.id,
      nom: user.nom,
      role: user.role as "technicien" | "responsable" | "admin",
      email: user.email || '',
      disponibilite: user.disponibilite,
      identifiant: user.identifiant || '',
      mdp: user.mdp || ''
    }));
  }
};

// Service d'équipes
export const equipeService = {
  getAll: async (): Promise<Equipe[]> => {
    const { data, error } = await supabase
      .from('equipes')
      .select('*');

    if (error) {
      console.error('Error fetching equipes:', error);
      throw error;
    }

    // Récupérer les membres pour chaque équipe
    const equipesWithMembres = await Promise.all(data.map(async (equipe) => {
      const { data: membresData, error: membresError } = await supabase
        .from('equipe_membres')
        .select('utilisateur_id')
        .eq('equipe_id', equipe.id);

      if (membresError) {
        console.error('Error fetching membres for equipe:', membresError);
        return {
          id: equipe.id,
          nom: equipe.nom,
          specialisation: equipe.specialisation || '',
          membres: []
        };
      }

      return {
        id: equipe.id,
        nom: equipe.nom,
        specialisation: equipe.specialisation || '',
        membres: membresData.map(m => m.utilisateur_id)
      };
    }));

    return equipesWithMembres;
  },
  
  getById: async (id: string): Promise<Equipe | undefined> => {
    const { data, error } = await supabase
      .from('equipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching equipe by id:', error);
      throw error;
    }

    if (!data) return undefined;

    // Récupérer les membres de l'équipe
    const { data: membresData, error: membresError } = await supabase
      .from('equipe_membres')
      .select('utilisateur_id')
      .eq('equipe_id', id);

    if (membresError) {
      console.error('Error fetching membres for equipe:', membresError);
      return {
        id: data.id,
        nom: data.nom,
        specialisation: data.specialisation || '',
        membres: []
      };
    }

    return {
      id: data.id,
      nom: data.nom,
      specialisation: data.specialisation || '',
      membres: membresData.map(m => m.utilisateur_id)
    };
  },
  
  getWithMembres: async (): Promise<(Equipe & { membresDetails: Utilisateur[] })[]> => {
    const equipes = await equipeService.getAll();
    const utilisateurs = await utilisateurService.getAll();
    
    return equipes.map(equipe => ({
      ...equipe,
      membresDetails: utilisateurs.filter(u => equipe.membres.includes(u.id))
    }));
  }
};

// Service de matériel
export const materielService = {
  getAll: async (): Promise<Materiel[]> => {
    const { data, error } = await supabase
      .from('materiels')
      .select('*');

    if (error) {
      console.error('Error fetching materiels:', error);
      throw error;
    }

    return data.map(materiel => ({
      id: materiel.id,
      reference: materiel.reference,
      typeMateriel: materiel.type_materiel,
      etat: materiel.etat as "disponible" | "en utilisation" | "en maintenance" | "hors service"
    }));
  },
  
  getById: async (id: string): Promise<Materiel | undefined> => {
    const { data, error } = await supabase
      .from('materiels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching materiel by id:', error);
      throw error;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      reference: data.reference,
      typeMateriel: data.type_materiel,
      etat: data.etat as "disponible" | "en utilisation" | "en maintenance" | "hors service"
    };
  },
  
  getByStatus: async (status: Materiel['etat']): Promise<Materiel[]> => {
    const { data, error } = await supabase
      .from('materiels')
      .select('*')
      .eq('etat', status);

    if (error) {
      console.error('Error fetching materiels by status:', error);
      throw error;
    }

    return data.map(materiel => ({
      id: materiel.id,
      reference: materiel.reference,
      typeMateriel: materiel.type_materiel,
      etat: materiel.etat as "disponible" | "en utilisation" | "en maintenance" | "hors service"
    }));
  }
};

// Pour les services demande_interventions, interventions, etc., je vais continuer avec le même format,
// mais je vous recommande de les implémenter au fur et à mesure selon vos besoins.

// Service de demandes d'intervention
export const demandeInterventionService = {
  getAll: async (): Promise<DemandeIntervention[]> => {
    const { data, error } = await supabase
      .from('demande_interventions')
      .select('*');

    if (error) {
      console.error('Error fetching demande_interventions:', error);
      throw error;
    }

    return data.map(demande => ({
      id: demande.id,
      dateDemande: new Date(demande.date_demande),
      statut: demande.statut as "en_attente" | "validée" | "rejetée",
      description: demande.description,
      urgence: demande.urgence as "basse" | "moyenne" | "haute" | "critique",
      clientId: demande.client_id,
      interventionId: demande.intervention_id
    }));
  },
  
  getById: async (id: string): Promise<DemandeIntervention | undefined> => {
    const { data, error } = await supabase
      .from('demande_interventions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching demande_intervention by id:', error);
      throw error;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      dateDemande: new Date(data.date_demande),
      statut: data.statut as "en_attente" | "validée" | "rejetée",
      description: data.description,
      urgence: data.urgence as "basse" | "moyenne" | "haute" | "critique",
      clientId: data.client_id,
      interventionId: data.intervention_id
    };
  },
  
  getByStatus: async (status: DemandeIntervention['statut']): Promise<DemandeIntervention[]> => {
    const { data, error } = await supabase
      .from('demande_interventions')
      .select('*')
      .eq('statut', status);

    if (error) {
      console.error('Error fetching demande_interventions by status:', error);
      throw error;
    }

    return data.map(demande => ({
      id: demande.id,
      dateDemande: new Date(demande.date_demande),
      statut: demande.statut as "en_attente" | "validée" | "rejetée",
      description: demande.description,
      urgence: demande.urgence as "basse" | "moyenne" | "haute" | "critique",
      clientId: demande.client_id,
      interventionId: demande.intervention_id
    }));
  },
  
  getWithClientDetails: async (): Promise<(DemandeIntervention & { client: Client })[]> => {
    const demandes = await demandeInterventionService.getAll();
    const clients = await clientService.getAll();
    
    return demandes.map(demande => {
      const client = clients.find(c => c.id === demande.clientId);
      return {
        ...demande,
        client: client!
      };
    });
  }
};

// Autres services à implémenter selon le besoin
export const interventionService = {
  // ... Implémenter les méthodes comme ci-dessus
  getAll: async (): Promise<Intervention[]> => {
    const { data, error } = await supabase
      .from('interventions')
      .select('*');

    if (error) {
      console.error('Error fetching interventions:', error);
      throw error;
    }

    const interventions = await Promise.all(data.map(async (intervention) => {
      // Récupérer les équipes associées à l'intervention
      const { data: equipesData, error: equipesError } = await supabase
        .from('intervention_equipes')
        .select('equipe_id')
        .eq('intervention_id', intervention.id);

      // Récupérer les matériels associés à l'intervention
      const { data: materielsData, error: materielsError } = await supabase
        .from('intervention_materiels')
        .select('materiel_id')
        .eq('intervention_id', intervention.id);

      if (equipesError) console.error('Error fetching equipes for intervention:', equipesError);
      if (materielsError) console.error('Error fetching materiels for intervention:', materielsError);

      return {
        id: intervention.id,
        dateDebut: intervention.date_debut ? new Date(intervention.date_debut) : null,
        dateFin: intervention.date_fin ? new Date(intervention.date_fin) : null,
        rapport: intervention.rapport,
        localisation: intervention.localisation,
        statut: intervention.statut as "planifiée" | "en_cours" | "terminée" | "annulée",
        demandeInterventionId: intervention.demande_intervention_id,
        equipesIds: equipesData?.map(e => e.equipe_id) || [],
        materielsIds: materielsData?.map(m => m.materiel_id) || [],
        facturationId: intervention.facturation_id,
        pvInterventionId: intervention.pv_intervention_id
      };
    }));

    return interventions;
  },
  
  getById: async (id: string): Promise<Intervention | undefined> => {
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching intervention by id:', error);
      throw error;
    }

    if (!data) return undefined;

    // Récupérer les équipes associées à l'intervention
    const { data: equipesData, error: equipesError } = await supabase
      .from('intervention_equipes')
      .select('equipe_id')
      .eq('intervention_id', id);

    // Récupérer les matériels associés à l'intervention
    const { data: materielsData, error: materielsError } = await supabase
      .from('intervention_materiels')
      .select('materiel_id')
      .eq('intervention_id', id);

    if (equipesError) console.error('Error fetching equipes for intervention:', equipesError);
    if (materielsError) console.error('Error fetching materiels for intervention:', materielsError);

    return {
      id: data.id,
      dateDebut: data.date_debut ? new Date(data.date_debut) : null,
      dateFin: data.date_fin ? new Date(data.date_fin) : null,
      rapport: data.rapport,
      localisation: data.localisation,
      statut: data.statut as "planifiée" | "en_cours" | "terminée" | "annulée",
      demandeInterventionId: data.demande_intervention_id,
      equipesIds: equipesData?.map(e => e.equipe_id) || [],
      materielsIds: materielsData?.map(m => m.materiel_id) || [],
      facturationId: data.facturation_id,
      pvInterventionId: data.pv_intervention_id
    };
  },
  
  getByStatus: async (status: Intervention['statut']): Promise<Intervention[]> => {
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('statut', status);

    if (error) {
      console.error('Error fetching interventions by status:', error);
      throw error;
    }

    const interventions = await Promise.all(data.map(async (intervention) => {
      // Récupérer les équipes associées à l'intervention
      const { data: equipesData, error: equipesError } = await supabase
        .from('intervention_equipes')
        .select('equipe_id')
        .eq('intervention_id', intervention.id);

      // Récupérer les matériels associés à l'intervention
      const { data: materielsData, error: materielsError } = await supabase
        .from('intervention_materiels')
        .select('materiel_id')
        .eq('intervention_id', intervention.id);

      if (equipesError) console.error('Error fetching equipes for intervention:', equipesError);
      if (materielsError) console.error('Error fetching materiels for intervention:', materielsError);

      return {
        id: intervention.id,
        dateDebut: intervention.date_debut ? new Date(intervention.date_debut) : null,
        dateFin: intervention.date_fin ? new Date(intervention.date_fin) : null,
        rapport: intervention.rapport,
        localisation: intervention.localisation,
        statut: intervention.statut as "planifiée" | "en_cours" | "terminée" | "annulée",
        demandeInterventionId: intervention.demande_intervention_id,
        equipesIds: equipesData?.map(e => e.equipe_id) || [],
        materielsIds: materielsData?.map(m => m.materiel_id) || [],
        facturationId: intervention.facturation_id,
        pvInterventionId: intervention.pv_intervention_id
      };
    }));

    return interventions;
  },
  
  getDetailedInterventions: async (options?: FilterOptions): Promise<any[]> => {
    let query = supabase
      .from('interventions')
      .select('*');
    
    if (options?.status) {
      query = query.eq('statut', options.status);
    }
    
    if (options?.dateRange?.from) {
      query = query.gte('date_debut', options.dateRange.from.toISOString());
    }
    
    if (options?.dateRange?.to) {
      query = query.lte('date_debut', options.dateRange.to.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching detailed interventions:', error);
      throw error;
    }
    
    // Récupérer les données associées
    const demandes = await demandeInterventionService.getAll();
    const clients = await clientService.getAll();
    const equipes = await equipeService.getAll();
    const materiels = await materielService.getAll();
    const facturations = await facturationService.getAll();
    const pvs = await pvInterventionService.getAll();
    
    // Filtrer par client si spécifié
    let filteredInterventions = [...data];
    if (options?.client) {
      const clientDemandesIds = demandes
        .filter(d => d.clientId === options.client)
        .map(d => d.id);
      
      filteredInterventions = filteredInterventions.filter(i => 
        clientDemandesIds.includes(i.demande_intervention_id)
      );
    }
    
    // Récupérer les relations intervention-équipes pour toutes les interventions
    const { data: allInterventionEquipes, error: equipesError } = await supabase
      .from('intervention_equipes')
      .select('*');
      
    if (equipesError) {
      console.error('Error fetching intervention_equipes:', equipesError);
      throw equipesError;
    }
    
    // Récupérer les relations intervention-matériels pour toutes les interventions
    const { data: allInterventionMateriels, error: materielsError } = await supabase
      .from('intervention_materiels')
      .select('*');
      
    if (materielsError) {
      console.error('Error fetching intervention_materiels:', materielsError);
      throw materielsError;
    }
    
    // Filtrer par équipe si spécifié
    if (options?.team) {
      const interventionsWithTeam = allInterventionEquipes
        .filter(ie => ie.equipe_id === options.team)
        .map(ie => ie.intervention_id);
      
      filteredInterventions = filteredInterventions.filter(i => 
        interventionsWithTeam.includes(i.id)
      );
    }
    
    // Enrichir les données avec détails liés
    return filteredInterventions.map(intervention => {
      const demande = demandes.find(d => d.id === intervention.demande_intervention_id)!;
      const client = clients.find(c => c.id === demande?.clientId)!;
      const interventionEquipes = allInterventionEquipes.filter(ie => ie.intervention_id === intervention.id);
      const interventionMateriels = allInterventionMateriels.filter(im => im.intervention_id === intervention.id);
      
      const interventionEquipesIds = interventionEquipes.map(ie => ie.equipe_id);
      const interventionMaterielsIds = interventionMateriels.map(im => im.materiel_id);
      
      const equipesDetails = equipes.filter(eq => interventionEquipesIds.includes(eq.id));
      const materielsDetails = materiels.filter(mat => interventionMaterielsIds.includes(mat.id));
      
      return {
        ...intervention,
        id: intervention.id,
        dateDebut: intervention.date_debut ? new Date(intervention.date_debut) : null,
        dateFin: intervention.date_fin ? new Date(intervention.date_fin) : null,
        rapport: intervention.rapport,
        localisation: intervention.localisation,
        statut: intervention.statut,
        demande,
        client,
        equipes: equipesDetails,
        materiels: materielsDetails,
        facturation: intervention.facturation_id ? 
          facturations.find(f => f.id === intervention.facturation_id) : undefined,
        pvIntervention: intervention.pv_intervention_id ?
          pvs.find(pv => pv.id === intervention.pv_intervention_id) : undefined
      };
    });
  }
};

// Implémenter les autres services selon le même modèle
export const pvInterventionService = {
  getAll: async (): Promise<PVIntervention[]> => {
    const { data, error } = await supabase
      .from('pv_interventions')
      .select('*');

    if (error) {
      console.error('Error fetching pv_interventions:', error);
      throw error;
    }

    return data.map(pv => ({
      id: pv.id,
      validationClient: pv.validation_client,
      dateValidation: pv.date_validation ? new Date(pv.date_validation) : null,
      commentaire: pv.commentaire,
      interventionId: pv.intervention_id,
      clientId: pv.client_id
    }));
  },
  
  getById: async (id: string): Promise<PVIntervention | undefined> => {
    const { data, error } = await supabase
      .from('pv_interventions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching pv_intervention by id:', error);
      throw error;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      validationClient: data.validation_client,
      dateValidation: data.date_validation ? new Date(data.date_validation) : null,
      commentaire: data.commentaire,
      interventionId: data.intervention_id,
      clientId: data.client_id
    };
  }
};

export const facturationService = {
  getAll: async (): Promise<Facturation[]> => {
    const { data: facturationsData, error: facturationsError } = await supabase
      .from('facturations')
      .select('*');

    if (facturationsError) {
      console.error('Error fetching facturations:', facturationsError);
      throw facturationsError;
    }

    // Récupérer tous les détails de facturation
    const { data: detailsData, error: detailsError } = await supabase
      .from('details_facturation')
      .select('*');

    if (detailsError) {
      console.error('Error fetching details_facturation:', detailsError);
      throw detailsError;
    }

    return facturationsData.map(facturation => {
      const details = detailsData
        .filter(d => d.facturation_id === facturation.id)
        .map(d => ({
          heuresTravaillees: Number(d.heures_travaillees),
          tauxHoraire: Number(d.taux_horaire),
          description: d.description
        }));

      return {
        id: facturation.id,
        dateFacturation: new Date(facturation.date_facturation),
        montantTotal: Number(facturation.montant_total),
        statutPaiement: facturation.statut_paiement as "en_attente" | "payée" | "annulée",
        detailsHeures: details,
        interventionId: facturation.intervention_id
      };
    });
  },
  
  getById: async (id: string): Promise<Facturation | undefined> => {
    const { data, error } = await supabase
      .from('facturations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching facturation by id:', error);
      throw error;
    }

    if (!data) return undefined;

    // Récupérer les détails de facturation
    const { data: detailsData, error: detailsError } = await supabase
      .from('details_facturation')
      .select('*')
      .eq('facturation_id', id);

    if (detailsError) {
      console.error('Error fetching details_facturation for facturation:', detailsError);
      throw detailsError;
    }

    const details = detailsData.map(d => ({
      heuresTravaillees: Number(d.heures_travaillees),
      tauxHoraire: Number(d.taux_horaire),
      description: d.description
    }));

    return {
      id: data.id,
      dateFacturation: new Date(data.date_facturation),
      montantTotal: Number(data.montant_total),
      statutPaiement: data.statut_paiement as "en_attente" | "payée" | "annulée",
      detailsHeures: details,
      interventionId: data.intervention_id
    };
  },
  
  getByStatus: async (status: Facturation['statutPaiement']): Promise<Facturation[]> => {
    const { data: facturationsData, error: facturationsError } = await supabase
      .from('facturations')
      .select('*')
      .eq('statut_paiement', status);

    if (facturationsError) {
      console.error('Error fetching facturations by status:', facturationsError);
      throw facturationsError;
    }

    // Récupérer tous les détails de facturation pour ces facturations
    const facturationsIds = facturationsData.map(f => f.id);
    const { data: detailsData, error: detailsError } = await supabase
      .from('details_facturation')
      .select('*')
      .in('facturation_id', facturationsIds);

    if (detailsError) {
      console.error('Error fetching details_facturation for facturations:', detailsError);
      throw detailsError;
    }

    return facturationsData.map(facturation => {
      const details = detailsData
        .filter(d => d.facturation_id === facturation.id)
        .map(d => ({
          heuresTravaillees: Number(d.heures_travaillees),
          tauxHoraire: Number(d.taux_horaire),
          description: d.description
        }));

      return {
        id: facturation.id,
        dateFacturation: new Date(facturation.date_facturation),
        montantTotal: Number(facturation.montant_total),
        statutPaiement: facturation.statut_paiement as "en_attente" | "payée" | "annulée",
        detailsHeures: details,
        interventionId: facturation.intervention_id
      };
    });
  },
  
  getWithInterventionDetails: async (): Promise<any[]> => {
    const facturations = await facturationService.getAll();
    const interventions = await interventionService.getAll();
    const demandes = await demandeInterventionService.getAll();
    const clients = await clientService.getAll();
    
    return facturations.map(facturation => {
      const intervention = interventions.find(i => i.id === facturation.interventionId)!;
      const demande = demandes.find(d => d.id === intervention?.demandeInterventionId)!;
      const client = clients.find(c => c.id === demande?.clientId)!;
      
      return {
        ...facturation,
        intervention,
        demande,
        client
      };
    });
  }
};

export const suiviEquipeService = {
  getAll: async (): Promise<SuiviEquipe[]> => {
    const { data, error } = await supabase
      .from('suivi_equipes')
      .select('*');

    if (error) {
      console.error('Error fetching suivi_equipes:', error);
      throw error;
    }

    return data.map(suivi => ({
      id: suivi.id,
      roleEquipe: suivi.role_equipe,
      statutIntervention: suivi.statut_intervention,
      dateAffectation: new Date(suivi.date_affectation),
      dateFin: suivi.date_fin ? new Date(suivi.date_fin) : null,
      localisation: suivi.localisation || '',
      equipeId: suivi.equipe_id,
      interventionId: suivi.intervention_id
    }));
  },
  
  getById: async (id: string): Promise<SuiviEquipe | undefined> => {
    const { data, error } = await supabase
      .from('suivi_equipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching suivi_equipe by id:', error);
      throw error;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      roleEquipe: data.role_equipe,
      statutIntervention: data.statut_intervention,
      dateAffectation: new Date(data.date_affectation),
      dateFin: data.date_fin ? new Date(data.date_fin) : null,
      localisation: data.localisation || '',
      equipeId: data.equipe_id,
      interventionId: data.intervention_id
    };
  },
  
  getActiveByEquipe: async (equipeId: string): Promise<SuiviEquipe[]> => {
    const { data, error } = await supabase
      .from('suivi_equipes')
      .select('*')
      .eq('equipe_id', equipeId)
      .is('date_fin', null);

    if (error) {
      console.error('Error fetching active suivi_equipes by equipe:', error);
      throw error;
    }

    return data.map(suivi => ({
      id: suivi.id,
      roleEquipe: suivi.role_equipe,
      statutIntervention: suivi.statut_intervention,
      dateAffectation: new Date(suivi.date_affectation),
      dateFin: suivi.date_fin ? new Date(suivi.date_fin) : null,
      localisation: suivi.localisation || '',
      equipeId: suivi.equipe_id,
      interventionId: suivi.intervention_id
    }));
  }
};

export const suiviMaterielService = {
  getAll: async (): Promise<SuiviMateriel[]> => {
    const { data, error } = await supabase
      .from('suivi_materiels')
      .select('*');

    if (error) {
      console.error('Error fetching suivi_materiels:', error);
      throw error;
    }

    return data.map(suivi => ({
      id: suivi.id,
      etatAvant: suivi.etat_avant,
      etatApres: suivi.etat_apres,
      localisation: suivi.localisation || '',
      dateSuivi: new Date(suivi.date_suivi),
      materielId: suivi.materiel_id,
      interventionId: suivi.intervention_id
    }));
  },
  
  getById: async (id: string): Promise<SuiviMateriel | undefined> => {
    const { data, error } = await supabase
      .from('suivi_materiels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching suivi_materiel by id:', error);
      throw error;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      etatAvant: data.etat_avant,
      etatApres: data.etat_apres,
      localisation: data.localisation || '',
      dateSuivi: new Date(data.date_suivi),
      materielId: data.materiel_id,
      interventionId: data.intervention_id
    };
  },
  
  getByMateriel: async (materielId: string): Promise<SuiviMateriel[]> => {
    const { data, error } = await supabase
      .from('suivi_materiels')
      .select('*')
      .eq('materiel_id', materielId);

    if (error) {
      console.error('Error fetching suivi_materiels by materiel:', error);
      throw error;
    }

    return data.map(suivi => ({
      id: suivi.id,
      etatAvant: suivi.etat_avant,
      etatApres: suivi.etat_apres,
      localisation: suivi.localisation || '',
      dateSuivi: new Date(suivi.date_suivi),
      materielId: suivi.materiel_id,
      interventionId: suivi.intervention_id
    }));
  }
};

// Service de statistiques du tableau de bord
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      // Compter les interventions par statut
      const { data: interventionsStats, error: interventionsError } = await supabase
        .from('interventions')
        .select('statut, count(*)', { count: 'exact' })
        .group('statut');

      if (interventionsError) throw interventionsError;

      // Compter les équipes disponibles et en mission
      const { data: equipesCount, error: equipesError } = await supabase
        .from('equipes')
        .select('count(*)', { count: 'exact' });

      if (equipesError) throw equipesError;

      // Récupérer les équipes actuellement en mission
      const { data: equipesEnMission, error: equipesEnMissionError } = await supabase
        .from('suivi_equipes')
        .select('equipe_id')
        .is('date_fin', null);

      if (equipesEnMissionError) throw equipesEnMissionError;

      // Compter les matériels par état
      const { data: materielsStats, error: materielsError } = await supabase
        .from('materiels')
        .select('etat, count(*)', { count: 'exact' })
        .group('etat');

      if (materielsError) throw materielsError;

      // Compter les facturations par statut
      const { data: facturationsStats, error: facturationsError } = await supabase
        .from('facturations')
        .select('statut_paiement, count(*)', { count: 'exact' })
        .group('statut_paiement');

      if (facturationsError) throw facturationsError;

      // Calculer les statistiques
      const totalInterventions = interventionsStats.reduce((acc, curr) => acc + curr.count, 0);
      const interventionsEnCours = interventionsStats.find(i => i.statut === 'en_cours')?.count || 0;
      const interventionsPlanifiees = interventionsStats.find(i => i.statut === 'planifiée')?.count || 0;
      const interventionsTerminees = interventionsStats.find(i => i.statut === 'terminée')?.count || 0;

      const equipesDisponibles = equipesCount[0]?.count - (new Set(equipesEnMission.map(e => e.equipe_id)).size) || 0;
      const equipesEnMissionCount = new Set(equipesEnMission.map(e => e.equipe_id)).size;

      const materielsDisponibles = materielsStats.find(m => m.etat === 'disponible')?.count || 0;
      const materielsEnUtilisation = materielsStats.find(m => m.etat === 'en utilisation')?.count || 0;

      const facturationEnAttente = facturationsStats.find(f => f.statut_paiement === 'en_attente')?.count || 0;
      const facturationPayee = facturationsStats.find(f => f.statut_paiement === 'payée')?.count || 0;

      return {
        totalInterventions,
        interventionsEnCours,
        interventionsPlanifiees,
        interventionsTerminees,
        equipesDisponibles,
        equipesEnMission: equipesEnMissionCount,
        materielsDisponibles,
        materielsEnUtilisation,
        facturationEnAttente,
        facturationPayee
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      throw error;
    }
  },
  
  getRecentActivity: async (): Promise<any[]> => {
    try {
      // Récupérer les dernières demandes d'intervention
      const { data: demandesData, error: demandesError } = await supabase
        .from('demande_interventions')
        .select('*, clients(nom_entreprise)')
        .order('date_demande', { ascending: false })
        .limit(10);

      if (demandesError) throw demandesError;

      // Récupérer les dernières interventions modifiées
      const { data: interventionsData, error: interventionsError } = await supabase
        .from('interventions')
        .select('*, demande_interventions(*), demande_interventions(client_id)')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (interventionsError) throw interventionsError;

      // Récupérer les dernières facturations
      const { data: facturationsData, error: facturationsError } = await supabase
        .from('facturations')
        .select('*, interventions(demande_intervention_id), interventions!inner(id)')
        .order('date_facturation', { ascending: false })
        .limit(10);

      if (facturationsError) throw facturationsError;

      // Récupérer les détails des clients pour les activités
      const clientIds = new Set([
        ...demandesData.map(d => d.client_id),
        ...interventionsData.map(i => i.demande_interventions?.client_id)
      ].filter(Boolean));

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, nom_entreprise')
        .in('id', Array.from(clientIds));

      if (clientsError) throw clientsError;

      // Combiner en une seule liste d'activités
      const activities = [
        ...demandesData.map(d => ({
          type: 'demande',
          date: d.date_demande,
          entity: d,
          client: d.clients?.nom_entreprise,
          message: `Nouvelle demande: ${d.description}`
        })),
        ...interventionsData.filter(i => i.date_debut).map(i => {
          const client = clientsData.find(c => c.id === i.demande_interventions?.client_id)?.nom_entreprise;
          return {
            type: 'intervention_debut',
            date: i.date_debut,
            entity: i,
            client,
            message: `Début d'intervention à ${i.localisation}`
          };
        }),
        ...interventionsData.filter(i => i.date_fin).map(i => {
          const client = clientsData.find(c => c.id === i.demande_interventions?.client_id)?.nom_entreprise;
          return {
            type: 'intervention_fin',
            date: i.date_fin,
            entity: i,
            client,
            message: `Fin d'intervention à ${i.localisation}`
          };
        }),
        ...facturationsData.map(f => {
          const intervention = interventionsData.find(i => i.id === f.intervention_id);
          const client = clientsData.find(c => c.id === intervention?.demande_interventions?.client_id)?.nom_entreprise;
          return {
            type: 'facturation',
            date: f.date_facturation,
            entity: f,
            client,
            message: `Facturation de ${f.montant_total}€ (${f.statut_paiement})`
          };
        })
      ];

      // Trier par date décroissante et limiter à 10
      return activities
        .filter(a => a.date) // S'assurer que la date existe
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting recent activities:', error);
      throw error;
    }
  }
};
