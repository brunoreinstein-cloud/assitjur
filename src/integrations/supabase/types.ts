export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          email: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          organization_id: string | null
          resource: string | null
          result: string
          role: Database["public"]["Enums"]["user_role"] | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          organization_id?: string | null
          resource?: string | null
          result: string
          role?: Database["public"]["Enums"]["user_role"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          organization_id?: string | null
          resource?: string | null
          result?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_files: {
        Row: {
          file_size: number | null
          id: string
          original_filename: string
          rows_count: number | null
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string
          validation_report: Json | null
          version_id: string
        }
        Insert: {
          file_size?: number | null
          id?: string
          original_filename: string
          rows_count?: number | null
          storage_path: string
          uploaded_at?: string | null
          uploaded_by: string
          validation_report?: Json | null
          version_id: string
        }
        Update: {
          file_size?: number | null
          id?: string
          original_filename?: string
          rows_count?: number | null
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string
          validation_report?: Json | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_files_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_versions: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          hash: string
          id: string
          is_active: boolean | null
          org_id: string
          published_at: string | null
          status: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          hash: string
          id?: string
          is_active?: boolean | null
          org_id: string
          published_at?: string | null
          status?: string
          version_number?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          hash?: string
          id?: string
          is_active?: boolean | null
          org_id?: string
          published_at?: string | null
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "dataset_versions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_errors: {
        Row: {
          column_name: string | null
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          job_id: string
          raw_value: string | null
          row_number: number | null
        }
        Insert: {
          column_name?: string | null
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          job_id: string
          raw_value?: string | null
          row_number?: number | null
        }
        Update: {
          column_name?: string | null
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          job_id?: string
          raw_value?: string | null
          row_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string
          error_message: string | null
          file_id: string
          id: string
          org_id: string
          progress: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          error_message?: string | null
          file_id: string
          id?: string
          org_id: string
          progress?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          error_message?: string | null
          file_id?: string
          id?: string
          org_id?: string
          progress?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "dataset_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          code: string
          created_at: string
          domain: string | null
          export_limit: string | null
          id: string
          is_active: boolean
          name: string
          require_2fa: boolean | null
          retention_months: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          domain?: string | null
          export_limit?: string | null
          id?: string
          is_active?: boolean
          name: string
          require_2fa?: boolean | null
          retention_months?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          domain?: string | null
          export_limit?: string | null
          id?: string
          is_active?: boolean
          name?: string
          require_2fa?: boolean | null
          retention_months?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pessoas: {
        Row: {
          apelidos: string[] | null
          cpf_mask: string | null
          created_at: string | null
          id: string
          nome_civil: string
          org_id: string
          updated_at: string | null
        }
        Insert: {
          apelidos?: string[] | null
          cpf_mask?: string | null
          created_at?: string | null
          id?: string
          nome_civil: string
          org_id: string
          updated_at?: string | null
        }
        Update: {
          apelidos?: string[] | null
          cpf_mask?: string | null
          created_at?: string | null
          id?: string
          nome_civil?: string
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          advogados_ativo: string[] | null
          advogados_passivo: string[] | null
          classificacao_final: string | null
          cnj: string
          cnj_normalizado: string
          comarca: string | null
          created_at: string | null
          data_audiencia: string | null
          deleted_at: string | null
          deleted_by: string | null
          fase: string | null
          id: string
          observacoes: string | null
          org_id: string
          prova_emprestada: boolean | null
          reclamante_cpf_mask: string | null
          reclamante_foi_testemunha: boolean | null
          reclamante_nome: string | null
          reu_nome: string | null
          score_risco: number | null
          status: string | null
          testemunhas_ativo: string[] | null
          testemunhas_passivo: string[] | null
          triangulacao_confirmada: boolean | null
          tribunal: string | null
          troca_direta: boolean | null
          updated_at: string | null
          vara: string | null
          version_id: string | null
        }
        Insert: {
          advogados_ativo?: string[] | null
          advogados_passivo?: string[] | null
          classificacao_final?: string | null
          cnj: string
          cnj_normalizado: string
          comarca?: string | null
          created_at?: string | null
          data_audiencia?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          fase?: string | null
          id?: string
          observacoes?: string | null
          org_id: string
          prova_emprestada?: boolean | null
          reclamante_cpf_mask?: string | null
          reclamante_foi_testemunha?: boolean | null
          reclamante_nome?: string | null
          reu_nome?: string | null
          score_risco?: number | null
          status?: string | null
          testemunhas_ativo?: string[] | null
          testemunhas_passivo?: string[] | null
          triangulacao_confirmada?: boolean | null
          tribunal?: string | null
          troca_direta?: boolean | null
          updated_at?: string | null
          vara?: string | null
          version_id?: string | null
        }
        Update: {
          advogados_ativo?: string[] | null
          advogados_passivo?: string[] | null
          classificacao_final?: string | null
          cnj?: string
          cnj_normalizado?: string
          comarca?: string | null
          created_at?: string | null
          data_audiencia?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          fase?: string | null
          id?: string
          observacoes?: string | null
          org_id?: string
          prova_emprestada?: boolean | null
          reclamante_cpf_mask?: string | null
          reclamante_foi_testemunha?: boolean | null
          reclamante_nome?: string | null
          reu_nome?: string | null
          score_risco?: number | null
          status?: string | null
          testemunhas_ativo?: string[] | null
          testemunhas_passivo?: string[] | null
          triangulacao_confirmada?: boolean | null
          tribunal?: string | null
          troca_direta?: boolean | null
          updated_at?: string | null
          vara?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          created_at: string
          id: string
          identifier: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_parameters: {
        Row: {
          description: string | null
          id: string
          org_id: string
          parameter_key: string
          parameter_value: Json
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          description?: string | null
          id?: string
          org_id: string
          parameter_key: string
          parameter_value: Json
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          description?: string | null
          id?: string
          org_id?: string
          parameter_key?: string
          parameter_value?: Json
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_parameters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "ADMIN" | "ANALYST" | "VIEWER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["ADMIN", "ANALYST", "VIEWER"],
    },
  },
} as const
