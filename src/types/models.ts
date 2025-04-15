export interface Client {
  id: string;
  nomEntreprise: string;
  tel: string;
  email: string;
  identifiant: string;
  mdp: string;
}

export interface Utilisateur {
  id: string;
  nom: string;
  role: "technicien" | "responsable" | "admin";
  email: string;
  disponibilite: boolean;
  identifiant: string;
  mdp: string;
}

export interface Equipe {
  id: string;
  nom: string;
  membres: string[]; // IDs des utilisateurs
  specialisation: string;
}

export interface SuiviEquipe {
  id: string;
  roleEquipe: string;
  statutIntervention: string;
  dateAffectation: Date;
  dateFin: Date | null;
  localisation: string;
  equipeId: string;
  interventionId: string;
}

export interface Materiel {
  id: string;
  reference: string;
  typeMateriel: string;
  etat: "disponible" | "en utilisation" | "en maintenance" | "hors service";
}

export interface SuiviMateriel {
  id: string;
  etatAvant: string;
  etatApres: string;
  localisation: string;
  dateSuivi: Date;
  materielId: string;
  interventionId: string;
}

export interface DemandeIntervention {
  id: string;
  dateDemande: Date;
  statut: "en_attente" | "validée" | "rejetée";
  description: string;
  urgence: "basse" | "moyenne" | "haute" | "critique";
  clientId: string;
  interventionId?: string;
}

export interface Intervention {
  id: string;
  dateDebut: Date | null;
  dateFin: Date | null;
  rapport: string | null;
  localisation: string;
  statut: "planifiée" | "en_cours" | "terminée" | "annulée";
  demandeInterventionId: string;
  equipesIds: string[]; // IDs des équipes
  materielsIds: string[]; // IDs des matériels
  facturationId?: string;
  pvInterventionId?: string;
}

export interface PVIntervention {
  id: string;
  validationClient: boolean | null;
  dateValidation: Date | null;
  commentaire?: string;
  interventionId: string;
  clientId: string;
}

export interface Facturation {
  id: string;
  dateFacturation: Date;
  montantTotal: number;
  statutPaiement: "en_attente" | "payée" | "annulée";
  detailsHeures: {
    heuresTravaillees: number;
    tauxHoraire: number;
    description: string;
  }[];
  interventionId: string;
}

export interface DashboardStats {
  totalInterventions: number;
  interventionsEnCours: number;
  interventionsPlanifiees: number;
  interventionsTerminees: number;
  equipesDisponibles: number;
  equipesEnMission: number;
  materielsDisponibles: number;
  materielsEnUtilisation: number;
  facturationEnAttente: number;
  facturationPayee: number;
}

export interface FilterOptions {
  status?: string;
  priority?: string;
  dateRange?: DateRange;
  client?: string;
  team?: string;
}
