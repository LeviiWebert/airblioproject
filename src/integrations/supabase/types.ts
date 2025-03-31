export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identifiant: string | null
          mdp: string | null
          nom_entreprise: string
          tel: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identifiant?: string | null
          mdp?: string | null
          nom_entreprise: string
          tel?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identifiant?: string | null
          mdp?: string | null
          nom_entreprise?: string
          tel?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      demande_interventions: {
        Row: {
          client_id: string | null
          created_at: string | null
          date_demande: string | null
          description: string
          id: string
          intervention_id: string | null
          statut: string | null
          updated_at: string | null
          urgence: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date_demande?: string | null
          description: string
          id?: string
          intervention_id?: string | null
          statut?: string | null
          updated_at?: string | null
          urgence?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date_demande?: string | null
          description?: string
          id?: string
          intervention_id?: string | null
          statut?: string | null
          updated_at?: string | null
          urgence?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demande_interventions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_intervention_id"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      details_facturation: {
        Row: {
          created_at: string | null
          description: string
          facturation_id: string | null
          heures_travaillees: number
          id: string
          taux_horaire: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          facturation_id?: string | null
          heures_travaillees: number
          id?: string
          taux_horaire: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          facturation_id?: string | null
          heures_travaillees?: number
          id?: string
          taux_horaire?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "details_facturation_facturation_id_fkey"
            columns: ["facturation_id"]
            isOneToOne: false
            referencedRelation: "facturations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipe_membres: {
        Row: {
          equipe_id: string | null
          id: string
          utilisateur_id: string | null
        }
        Insert: {
          equipe_id?: string | null
          id?: string
          utilisateur_id?: string | null
        }
        Update: {
          equipe_id?: string | null
          id?: string
          utilisateur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipe_membres_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipe_membres_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          created_at: string | null
          id: string
          nom: string
          specialisation: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nom: string
          specialisation?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nom?: string
          specialisation?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      facturations: {
        Row: {
          created_at: string | null
          date_facturation: string | null
          id: string
          intervention_id: string | null
          montant_total: number
          statut_paiement: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_facturation?: string | null
          id?: string
          intervention_id?: string | null
          montant_total: number
          statut_paiement?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_facturation?: string | null
          id?: string
          intervention_id?: string | null
          montant_total?: number
          statut_paiement?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturations_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_equipes: {
        Row: {
          equipe_id: string | null
          id: string
          intervention_id: string | null
        }
        Insert: {
          equipe_id?: string | null
          id?: string
          intervention_id?: string | null
        }
        Update: {
          equipe_id?: string | null
          id?: string
          intervention_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intervention_equipes_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_equipes_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_materiels: {
        Row: {
          id: string
          intervention_id: string | null
          materiel_id: string | null
        }
        Insert: {
          id?: string
          intervention_id?: string | null
          materiel_id?: string | null
        }
        Update: {
          id?: string
          intervention_id?: string | null
          materiel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intervention_materiels_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_materiels_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiels"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          created_at: string | null
          date_debut: string | null
          date_fin: string | null
          demande_intervention_id: string | null
          facturation_id: string | null
          id: string
          localisation: string
          pv_intervention_id: string | null
          rapport: string | null
          statut: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          demande_intervention_id?: string | null
          facturation_id?: string | null
          id?: string
          localisation: string
          pv_intervention_id?: string | null
          rapport?: string | null
          statut?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          demande_intervention_id?: string | null
          facturation_id?: string | null
          id?: string
          localisation?: string
          pv_intervention_id?: string | null
          rapport?: string | null
          statut?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interventions_demande_intervention_id_fkey"
            columns: ["demande_intervention_id"]
            isOneToOne: false
            referencedRelation: "demande_interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      materiels: {
        Row: {
          created_at: string | null
          etat: string | null
          id: string
          reference: string
          type_materiel: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          etat?: string | null
          id?: string
          reference: string
          type_materiel: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          etat?: string | null
          id?: string
          reference?: string
          type_materiel?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pv_interventions: {
        Row: {
          client_id: string | null
          commentaire: string | null
          created_at: string | null
          date_validation: string | null
          id: string
          intervention_id: string | null
          updated_at: string | null
          validation_client: boolean | null
        }
        Insert: {
          client_id?: string | null
          commentaire?: string | null
          created_at?: string | null
          date_validation?: string | null
          id?: string
          intervention_id?: string | null
          updated_at?: string | null
          validation_client?: boolean | null
        }
        Update: {
          client_id?: string | null
          commentaire?: string | null
          created_at?: string | null
          date_validation?: string | null
          id?: string
          intervention_id?: string | null
          updated_at?: string | null
          validation_client?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pv_interventions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pv_interventions_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      suivi_equipes: {
        Row: {
          created_at: string | null
          date_affectation: string | null
          date_fin: string | null
          equipe_id: string | null
          id: string
          intervention_id: string | null
          localisation: string | null
          role_equipe: string
          statut_intervention: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_affectation?: string | null
          date_fin?: string | null
          equipe_id?: string | null
          id?: string
          intervention_id?: string | null
          localisation?: string | null
          role_equipe: string
          statut_intervention: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_affectation?: string | null
          date_fin?: string | null
          equipe_id?: string | null
          id?: string
          intervention_id?: string | null
          localisation?: string | null
          role_equipe?: string
          statut_intervention?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suivi_equipes_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_equipes_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      suivi_materiels: {
        Row: {
          created_at: string | null
          date_suivi: string | null
          etat_apres: string
          etat_avant: string
          id: string
          intervention_id: string | null
          localisation: string | null
          materiel_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_suivi?: string | null
          etat_apres: string
          etat_avant: string
          id?: string
          intervention_id?: string | null
          localisation?: string | null
          materiel_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_suivi?: string | null
          etat_apres?: string
          etat_avant?: string
          id?: string
          intervention_id?: string | null
          localisation?: string | null
          materiel_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suivi_materiels_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_materiels_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiels"
            referencedColumns: ["id"]
          },
        ]
      }
      utilisateurs: {
        Row: {
          created_at: string | null
          disponibilite: boolean | null
          email: string | null
          id: string
          identifiant: string | null
          mdp: string | null
          nom: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disponibilite?: boolean | null
          email?: string | null
          id?: string
          identifiant?: string | null
          mdp?: string | null
          nom: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disponibilite?: boolean | null
          email?: string | null
          id?: string
          identifiant?: string | null
          mdp?: string | null
          nom?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
