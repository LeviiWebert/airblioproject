
import { 
  Client, Utilisateur, Equipe, Materiel, 
  DemandeIntervention, Intervention, PVIntervention,
  Facturation, SuiviEquipe, SuiviMateriel, DashboardStats
} from '@/types/models';

// Generate random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Génération de dates aléatoires
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Dates communes
const now = new Date();
const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

// Clients
export const clients: Client[] = [
  {
    id: "client1",
    nomEntreprise: "Océan Solutions",
    tel: "0123456789",
    email: "contact@oceansolutions.fr",
    identifiant: "oceansolutions",
    mdp: "password123"
  },
  {
    id: "client2",
    nomEntreprise: "Port Maritime de Marseille",
    tel: "0145789632",
    email: "info@portmarseille.fr",
    identifiant: "portmarseille",
    mdp: "password123"
  },
  {
    id: "client3",
    nomEntreprise: "Énergie Marine SA",
    tel: "0678912345",
    email: "contact@energiemarine.com",
    identifiant: "energiemarine",
    mdp: "password123"
  },
  {
    id: "client4",
    nomEntreprise: "Aquaculture Méditerranée",
    tel: "0478123698",
    email: "info@aquamed.fr",
    identifiant: "aquamed",
    mdp: "password123"
  },
  {
    id: "client5",
    nomEntreprise: "Chantier Naval du Sud",
    tel: "0512369874",
    email: "contact@navalsud.fr",
    identifiant: "navalsud",
    mdp: "password123"
  }
];

// Utilisateurs
export const utilisateurs: Utilisateur[] = [
  {
    id: "user1",
    nom: "Martin Dupont",
    role: "technicien",
    email: "m.dupont@intertech.fr",
    disponibilite: true,
    identifiant: "mdupont",
    mdp: "password123"
  },
  {
    id: "user2",
    nom: "Sophie Laurent",
    role: "technicien",
    email: "s.laurent@intertech.fr",
    disponibilite: false,
    identifiant: "slaurent",
    mdp: "password123"
  },
  {
    id: "user3",
    nom: "Jean Moreau",
    role: "responsable",
    email: "j.moreau@intertech.fr",
    disponibilite: true,
    identifiant: "jmoreau",
    mdp: "password123"
  },
  {
    id: "user4",
    nom: "Camille Petit",
    role: "technicien",
    email: "c.petit@intertech.fr",
    disponibilite: true,
    identifiant: "cpetit",
    mdp: "password123"
  },
  {
    id: "user5",
    nom: "Philippe Dubois",
    role: "admin",
    email: "p.dubois@intertech.fr",
    disponibilite: true,
    identifiant: "pdubois",
    mdp: "password123"
  },
  {
    id: "user6",
    nom: "Lucie Martin",
    role: "technicien",
    email: "l.martin@intertech.fr",
    disponibilite: false,
    identifiant: "lmartin",
    mdp: "password123"
  }
];

// Équipes
export const equipes: Equipe[] = [
  {
    id: "equipe1",
    nom: "Équipe Alpha",
    membres: ["user1", "user4"],
    specialisation: "Maintenance sous-marine"
  },
  {
    id: "equipe2",
    nom: "Équipe Bravo",
    membres: ["user2", "user6"],
    specialisation: "Installation de structures"
  },
  {
    id: "equipe3",
    nom: "Équipe Charlie",
    membres: ["user1", "user2"],
    specialisation: "Inspection et diagnostic"
  },
  {
    id: "equipe4",
    nom: "Équipe Delta",
    membres: ["user4", "user6"],
    specialisation: "Réparation d'urgence"
  }
];

// Matériel
export const materiels: Materiel[] = [
  {
    id: "mat1",
    reference: "EQUIPL-001",
    typeMateriel: "Équipement de plongée",
    etat: "disponible"
  },
  {
    id: "mat2",
    reference: "CAMSO-002",
    typeMateriel: "Caméra sous-marine",
    etat: "en utilisation"
  },
  {
    id: "mat3",
    reference: "OUTSO-003",
    typeMateriel: "Outillage sous-marin",
    etat: "disponible"
  },
  {
    id: "mat4",
    reference: "BATEAU-004",
    typeMateriel: "Embarcation légère",
    etat: "en maintenance"
  },
  {
    id: "mat5",
    reference: "ROBOT-005",
    typeMateriel: "ROV d'exploration",
    etat: "disponible"
  },
  {
    id: "mat6",
    reference: "SOUDURE-006",
    typeMateriel: "Équipement de soudure sous-marine",
    etat: "en utilisation"
  },
  {
    id: "mat7",
    reference: "COMPR-007",
    typeMateriel: "Compresseur",
    etat: "disponible"
  }
];

// Demandes d'intervention
export const demandesIntervention: DemandeIntervention[] = [
  {
    id: "demande1",
    dateDemande: twoMonthsAgo,
    statut: "validée",
    description: "Inspection annuelle des structures immergées du port",
    urgence: "basse",
    clientId: "client2",
    interventionId: "interv1"
  },
  {
    id: "demande2",
    dateDemande: oneMonthAgo,
    statut: "validée",
    description: "Réparation fuite conduite sous-marine",
    urgence: "critique",
    clientId: "client3",
    interventionId: "interv2"
  },
  {
    id: "demande3",
    dateDemande: randomDate(oneMonthAgo, now),
    statut: "validée",
    description: "Installation de capteurs de surveillance",
    urgence: "moyenne",
    clientId: "client1",
    interventionId: "interv3"
  },
  {
    id: "demande4",
    dateDemande: randomDate(oneMonthAgo, now),
    statut: "en_attente",
    description: "Maintenance préventive des cages d'aquaculture",
    urgence: "basse",
    clientId: "client4"
  },
  {
    id: "demande5",
    dateDemande: now,
    statut: "en_attente",
    description: "Inspection de la coque du navire avant mise à l'eau",
    urgence: "haute",
    clientId: "client5"
  },
  {
    id: "demande6",
    dateDemande: randomDate(oneMonthAgo, now),
    statut: "rejetée",
    description: "Récupération d'objet en zone profonde",
    urgence: "moyenne",
    clientId: "client1"
  }
];

// Interventions
export const interventions: Intervention[] = [
  {
    id: "interv1",
    dateDebut: randomDate(oneMonthAgo, now),
    dateFin: randomDate(now, nextMonth),
    rapport: "Inspection complète réalisée. Structure en bon état général, quelques points de corrosion à surveiller sur la zone Est.",
    localisation: "Port Maritime de Marseille - Quai Nord",
    statut: "planifiée",
    demandeInterventionId: "demande1",
    equipesIds: ["equipe3"],
    materielsIds: ["mat2", "mat5"],
    facturationId: "fact1"
  },
  {
    id: "interv2",
    dateDebut: randomDate(oneMonthAgo, now),
    dateFin: new Date(),
    rapport: "Réparation effectuée en urgence. Remplacement d'un segment de 2m de conduite et renforcement des jonctions.",
    localisation: "Plateforme offshore - Zone Delta",
    statut: "terminée",
    demandeInterventionId: "demande2",
    equipesIds: ["equipe4"],
    materielsIds: ["mat1", "mat6"],
    facturationId: "fact2",
    pvInterventionId: "pv1"
  },
  {
    id: "interv3",
    dateDebut: new Date(),
    dateFin: null,
    rapport: null,
    localisation: "Bouée de surveillance - Zone Côtière Sud",
    statut: "en_cours",
    demandeInterventionId: "demande3",
    equipesIds: ["equipe1"],
    materielsIds: ["mat2", "mat3", "mat7"]
  }
];

// PV d'intervention
export const pvInterventions: PVIntervention[] = [
  {
    id: "pv1",
    validation_client: true,
    date_validation: new Date(),
    interventionId: "interv2",
    clientId: "client3"
  }
];

// Facturations
export const facturations: Facturation[] = [
  {
    id: "fact1",
    dateFacturation: randomDate(now, nextMonth),
    montantTotal: 2500,
    statutPaiement: "en_attente",
    detailsHeures: [
      {
        heuresTravaillees: 15,
        tauxHoraire: 120,
        description: "Travaux d'inspection"
      },
      {
        heuresTravaillees: 5,
        tauxHoraire: 150,
        description: "Rédaction de rapport technique"
      }
    ],
    interventionId: "interv1"
  },
  {
    id: "fact2",
    dateFacturation: new Date(),
    montantTotal: 8750,
    statutPaiement: "payée",
    detailsHeures: [
      {
        heuresTravaillees: 25,
        tauxHoraire: 250,
        description: "Intervention d'urgence"
      },
      {
        heuresTravaillees: 10,
        tauxHoraire: 150,
        description: "Préparation et tests"
      },
      {
        heuresTravaillees: 5,
        tauxHoraire: 100,
        description: "Documentation et rapport"
      }
    ],
    interventionId: "interv2"
  }
];

// Suivi des équipes
export const suiviEquipes: SuiviEquipe[] = [
  {
    id: "suivi_eq1",
    roleEquipe: "Inspection principale",
    statutIntervention: "En préparation",
    dateAffectation: randomDate(oneMonthAgo, now),
    dateFin: null,
    localisation: "Port Maritime de Marseille",
    equipeId: "equipe3",
    interventionId: "interv1"
  },
  {
    id: "suivi_eq2",
    roleEquipe: "Intervention d'urgence",
    statutIntervention: "Terminée",
    dateAffectation: randomDate(oneMonthAgo, now),
    dateFin: new Date(),
    localisation: "Plateforme offshore",
    equipeId: "equipe4",
    interventionId: "interv2"
  },
  {
    id: "suivi_eq3",
    roleEquipe: "Installation technique",
    statutIntervention: "En cours",
    dateAffectation: new Date(),
    dateFin: null,
    localisation: "Zone Côtière Sud",
    equipeId: "equipe1",
    interventionId: "interv3"
  }
];

// Suivi du matériel
export const suiviMateriels: SuiviMateriel[] = [
  {
    id: "suivi_mat1",
    etatAvant: "disponible",
    etatApres: "en utilisation",
    localisation: "Port Maritime de Marseille",
    dateSuivi: randomDate(oneMonthAgo, now),
    materielId: "mat2",
    interventionId: "interv1"
  },
  {
    id: "suivi_mat2",
    etatAvant: "disponible",
    etatApres: "en utilisation",
    localisation: "Port Maritime de Marseille",
    dateSuivi: randomDate(oneMonthAgo, now),
    materielId: "mat5",
    interventionId: "interv1"
  },
  {
    id: "suivi_mat3",
    etatAvant: "en utilisation",
    etatApres: "disponible",
    localisation: "Plateforme offshore",
    dateSuivi: new Date(),
    materielId: "mat1",
    interventionId: "interv2"
  }
];

// Statistiques du tableau de bord
export const dashboardStats: DashboardStats = {
  totalInterventions: interventions.length + demandesIntervention.filter(d => d.statut === "en_attente").length,
  interventionsEnCours: interventions.filter(i => i.statut === "en_cours").length,
  interventionsPlanifiees: interventions.filter(i => i.statut === "planifiée").length,
  interventionsTerminees: interventions.filter(i => i.statut === "terminée").length,
  equipesDisponibles: equipes.length - suiviEquipes.filter(se => se.dateFin === null).length,
  equipesEnMission: suiviEquipes.filter(se => se.dateFin === null).length,
  materielsDisponibles: materiels.filter(m => m.etat === "disponible").length,
  materielsEnUtilisation: materiels.filter(m => m.etat === "en utilisation").length,
  facturationEnAttente: facturations.filter(f => f.statutPaiement === "en_attente").length,
  facturationPayee: facturations.filter(f => f.statutPaiement === "payée").length
};
