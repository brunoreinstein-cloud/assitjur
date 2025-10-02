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
          action: string | null
          created_at: string | null
          email: string | null
          id: string
          ip_address: string | null
          legal_basis: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          record_id: string | null
          resource: string | null
          result: string | null
          role: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          legal_basis?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          record_id?: string | null
          resource?: string | null
          result?: string | null
          role?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          legal_basis?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          record_id?: string | null
          resource?: string | null
          result?: string | null
          role?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      beta_signups: {
        Row: {
          cargo: string | null
          created_at: string
          email: string
          id: string
          necessidades: string[]
          nome: string
          organizacao: string
          outro_texto: string | null
          updated_at: string
          utm: Json | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email: string
          id?: string
          necessidades?: string[]
          nome: string
          organizacao: string
          outro_texto?: string | null
          updated_at?: string
          utm?: Json | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string
          id?: string
          necessidades?: string[]
          nome?: string
          organizacao?: string
          outro_texto?: string | null
          updated_at?: string
          utm?: Json | null
        }
        Relationships: []
      }
      citations: {
        Row: {
          data: string | null
          ementa: string | null
          id: string
          link: string | null
          numero: string | null
          session_id: string | null
          tribunal: string | null
        }
        Insert: {
          data?: string | null
          ementa?: string | null
          id?: string
          link?: string | null
          numero?: string | null
          session_id?: string | null
          tribunal?: string | null
        }
        Update: {
          data?: string | null
          ementa?: string | null
          id?: string
          link?: string | null
          numero?: string | null
          session_id?: string | null
          tribunal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanup_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          org_id: string
          policy_id: string
          records_affected: number
          started_at: string
          status: string
          table_name: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          policy_id: string
          records_affected?: number
          started_at?: string
          status: string
          table_name: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          policy_id?: string
          records_affected?: number
          started_at?: string
          status?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleanup_logs_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "retention_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      cogs_monthly: {
        Row: {
          db: number | null
          hosting: number | null
          infra_other: number | null
          llm_tokens: number | null
          month: string
          support: number | null
          updated_at: string | null
        }
        Insert: {
          db?: number | null
          hosting?: number | null
          infra_other?: number | null
          llm_tokens?: number | null
          month: string
          support?: number | null
          updated_at?: string | null
        }
        Update: {
          db?: number | null
          hosting?: number | null
          infra_other?: number | null
          llm_tokens?: number | null
          month?: string
          support?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      csat: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          score: number | null
          session_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          session_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "csat_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          access_type: string
          accessed_records: string[] | null
          accessed_table: string
          created_at: string
          id: string
          ip_address: unknown | null
          org_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_records?: string[] | null
          accessed_table: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          org_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_records?: string[] | null
          accessed_table?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          org_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          auto_cleanup: boolean
          created_at: string
          id: string
          last_cleanup_at: string | null
          org_id: string
          retention_months: number
          table_name: string
          updated_at: string
        }
        Insert: {
          auto_cleanup?: boolean
          created_at?: string
          id?: string
          last_cleanup_at?: string | null
          org_id: string
          retention_months?: number
          table_name: string
          updated_at?: string
        }
        Update: {
          auto_cleanup?: boolean
          created_at?: string
          id?: string
          last_cleanup_at?: string | null
          org_id?: string
          retention_months?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
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
      example: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: never
          name: string
        }
        Update: {
          id?: never
          name?: string
        }
        Relationships: []
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
      invoices: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          discounts: number
          id: number
          issued_at: string
          metadata: Json | null
          status: string
          tax_amount: number
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id: string
          discounts?: number
          id?: never
          issued_at: string
          metadata?: Json | null
          status: string
          tax_amount?: number
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          discounts?: number
          id?: never
          issued_at?: string
          metadata?: Json | null
          status?: string
          tax_amount?: number
        }
        Relationships: []
      }
      legal_cases: {
        Row: {
          case_number: string | null
          created_at: string | null
          id: string
          org_id: string | null
        }
        Insert: {
          case_number?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
        }
        Update: {
          case_number?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
        }
        Relationships: []
      }
      lgpd_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          justification: string | null
          org_id: string
          request_type: string
          requested_by_email: string
          response_data: Json | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          justification?: string | null
          org_id: string
          request_type: string
          requested_by_email: string
          response_data?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          justification?: string | null
          org_id?: string
          request_type?: string
          requested_by_email?: string
          response_data?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      openai_keys: {
        Row: {
          alias: string
          created_at: string
          created_by: string
          encrypted_key: string | null
          id: string
          is_active: boolean
          last_four: string
          last_used_at: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          alias: string
          created_at?: string
          created_by: string
          encrypted_key?: string | null
          id?: string
          is_active?: boolean
          last_four: string
          last_used_at?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          alias?: string
          created_at?: string
          created_by?: string
          encrypted_key?: string | null
          id?: string
          is_active?: boolean
          last_four?: string
          last_used_at?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      openai_logs: {
        Row: {
          cost_cents: number
          created_at: string
          duration_ms: number
          error_code: string | null
          hash_base: string | null
          id: string
          model: string
          org_id: string
          prompt_id: string | null
          prompt_version: number | null
          request_type: string
          status_code: number
          streaming: boolean
          tokens_in: number
          tokens_out: number
          user_id: string
        }
        Insert: {
          cost_cents?: number
          created_at?: string
          duration_ms?: number
          error_code?: string | null
          hash_base?: string | null
          id?: string
          model: string
          org_id: string
          prompt_id?: string | null
          prompt_version?: number | null
          request_type?: string
          status_code?: number
          streaming?: boolean
          tokens_in?: number
          tokens_out?: number
          user_id: string
        }
        Update: {
          cost_cents?: number
          created_at?: string
          duration_ms?: number
          error_code?: string | null
          hash_base?: string | null
          id?: string
          model?: string
          org_id?: string
          prompt_id?: string | null
          prompt_version?: number | null
          request_type?: string
          status_code?: number
          streaming?: boolean
          tokens_in?: number
          tokens_out?: number
          user_id?: string
        }
        Relationships: []
      }
      openai_test_cases: {
        Row: {
          created_at: string
          created_by: string
          expected_output: Json | null
          id: string
          input_data: Json
          last_result: Json | null
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expected_output?: Json | null
          id?: string
          input_data: Json
          last_result?: Json | null
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expected_output?: Json | null
          id?: string
          input_data?: Json
          last_result?: Json | null
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      opex_monthly: {
        Row: {
          admin: number | null
          month: string
          other: number | null
          payroll: number | null
          sales_marketing: number | null
          tools: number | null
          updated_at: string | null
        }
        Insert: {
          admin?: number | null
          month: string
          other?: number | null
          payroll?: number | null
          sales_marketing?: number | null
          tools?: number | null
          updated_at?: string | null
        }
        Update: {
          admin?: number | null
          month?: string
          other?: number | null
          payroll?: number | null
          sales_marketing?: number | null
          tools?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          ab_weights: Json | null
          budget_month_cents: number
          created_at: string
          fallback: string[] | null
          id: string
          max_output_tokens: number
          model: string
          openai_enabled: boolean
          org_id: string
          prompt_active_id: string | null
          rate_per_min: number
          schema_json: Json
          streaming: boolean
          temperature: number
          top_p: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          ab_weights?: Json | null
          budget_month_cents?: number
          created_at?: string
          fallback?: string[] | null
          id?: string
          max_output_tokens?: number
          model?: string
          openai_enabled?: boolean
          org_id: string
          prompt_active_id?: string | null
          rate_per_min?: number
          schema_json?: Json
          streaming?: boolean
          temperature?: number
          top_p?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          ab_weights?: Json | null
          budget_month_cents?: number
          created_at?: string
          fallback?: string[] | null
          id?: string
          max_output_tokens?: number
          model?: string
          openai_enabled?: boolean
          org_id?: string
          prompt_active_id?: string | null
          rate_per_min?: number
          schema_json?: Json
          streaming?: boolean
          temperature?: number
          top_p?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
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
      orgs: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
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
          cnj_digits: string | null
          cnj_normalizado: string
          comarca: string | null
          created_at: string | null
          created_by: string | null
          data_audiencia: string | null
          deleted_at: string | null
          deleted_by: string | null
          fase: string | null
          id: string
          numero_cnj: string | null
          observacoes: string | null
          org_id: string
          prova_emprestada: boolean | null
          reclamante_cpf_mask: string | null
          reclamante_foi_testemunha: boolean | null
          reclamante_nome: string | null
          reu_nome: string | null
          score_risco: number | null
          segredo_justica: boolean | null
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
          cnj_digits?: string | null
          cnj_normalizado: string
          comarca?: string | null
          created_at?: string | null
          created_by?: string | null
          data_audiencia?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          fase?: string | null
          id?: string
          numero_cnj?: string | null
          observacoes?: string | null
          org_id: string
          prova_emprestada?: boolean | null
          reclamante_cpf_mask?: string | null
          reclamante_foi_testemunha?: boolean | null
          reclamante_nome?: string | null
          reu_nome?: string | null
          score_risco?: number | null
          segredo_justica?: boolean | null
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
          cnj_digits?: string | null
          cnj_normalizado?: string
          comarca?: string | null
          created_at?: string | null
          created_by?: string | null
          data_audiencia?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          fase?: string | null
          id?: string
          numero_cnj?: string | null
          observacoes?: string | null
          org_id?: string
          prova_emprestada?: boolean | null
          reclamante_cpf_mask?: string | null
          reclamante_foi_testemunha?: boolean | null
          reclamante_nome?: string | null
          reu_nome?: string | null
          score_risco?: number | null
          segredo_justica?: boolean | null
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
            referencedRelation: "versions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          data_access_level:
            | Database["public"]["Enums"]["data_access_level"]
            | null
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_access_level?:
            | Database["public"]["Enums"]["data_access_level"]
            | null
          email: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_access_level?:
            | Database["public"]["Enums"]["data_access_level"]
            | null
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
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
      prompts: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          label: string
          org_id: string
          template_type: string
          updated_at: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          label: string
          org_id: string
          template_type?: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          label?: string
          org_id?: string
          template_type?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      rate_limit_counters: {
        Row: {
          expires_at: string
          hits: number
          route: string
          subject_id: string
        }
        Insert: {
          expires_at: string
          hits?: number
          route: string
          subject_id: string
        }
        Update: {
          expires_at?: string
          hits?: number
          route?: string
          subject_id?: string
        }
        Relationships: []
      }
      rate_limit_hits: {
        Row: {
          created_at: string
          route: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          route: string
          subject_id: string
        }
        Update: {
          created_at?: string
          route?: string
          subject_id?: string
        }
        Relationships: []
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
      rate_limits_enhanced: {
        Row: {
          blocked_until: string | null
          created_at: string | null
          endpoint: string
          id: string
          org_id: string | null
          request_count: number | null
          updated_at: string | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          org_id?: string | null
          request_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          org_id?: string | null
          request_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      retention_policies: {
        Row: {
          auto_cleanup: boolean
          cleanup_field: string
          conditions: Json | null
          created_at: string
          id: string
          last_cleanup_at: string | null
          next_cleanup_at: string | null
          org_id: string
          retention_months: number
          table_name: string
          updated_at: string
        }
        Insert: {
          auto_cleanup?: boolean
          cleanup_field?: string
          conditions?: Json | null
          created_at?: string
          id?: string
          last_cleanup_at?: string | null
          next_cleanup_at?: string | null
          org_id: string
          retention_months?: number
          table_name: string
          updated_at?: string
        }
        Update: {
          auto_cleanup?: boolean
          cleanup_field?: string
          conditions?: Json | null
          created_at?: string
          id?: string
          last_cleanup_at?: string | null
          next_cleanup_at?: string | null
          org_id?: string
          retention_months?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          id: string
          mode: string
          org_id: string | null
          used_rag: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode: string
          org_id?: string | null
          used_rag?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mode?: string
          org_id?: string | null
          used_rag?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stg_processos: {
        Row: {
          cnj: string | null
          cnj_digits: string | null
          comarca: string | null
          data_audiencia: string | null
          fase: string | null
          import_job_id: string | null
          observacoes: string | null
          reclamante_cpf: string | null
          reclamante_limpo: string | null
          reu_nome: string | null
          row_number: number | null
          status: string | null
          tribunal: string | null
          vara: string | null
        }
        Insert: {
          cnj?: string | null
          cnj_digits?: string | null
          comarca?: string | null
          data_audiencia?: string | null
          fase?: string | null
          import_job_id?: string | null
          observacoes?: string | null
          reclamante_cpf?: string | null
          reclamante_limpo?: string | null
          reu_nome?: string | null
          row_number?: number | null
          status?: string | null
          tribunal?: string | null
          vara?: string | null
        }
        Update: {
          cnj?: string | null
          cnj_digits?: string | null
          comarca?: string | null
          data_audiencia?: string | null
          fase?: string | null
          import_job_id?: string | null
          observacoes?: string | null
          reclamante_cpf?: string | null
          reclamante_limpo?: string | null
          reu_nome?: string | null
          row_number?: number | null
          status?: string | null
          tribunal?: string | null
          vara?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          customer_id: string
          id: number
          plan: string | null
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: never
          plan?: string | null
          started_at: string
          status: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: never
          plan?: string | null
          started_at?: string
          status?: string
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
      testemunhas: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          org_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          org_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testemunhas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          data_access_level: Database["public"]["Enums"]["data_access_level"]
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          data_access_level?: Database["public"]["Enums"]["data_access_level"]
          email: string
          expires_at?: string
          id?: string
          invitation_token: string
          invited_by: string
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          data_access_level?: Database["public"]["Enums"]["data_access_level"]
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Relationships: []
      }
      user_mfa_status: {
        Row: {
          created_at: string | null
          id: string
          last_verified_at: string | null
          mfa_enabled: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_accessed: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_accessed?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_accessed?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      validation_rules: {
        Row: {
          column_name: string
          created_at: string | null
          error_message: string
          id: string
          is_active: boolean | null
          rule_config: Json
          rule_type: string
          table_name: string
          updated_at: string | null
        }
        Insert: {
          column_name: string
          created_at?: string | null
          error_message: string
          id?: string
          is_active?: boolean | null
          rule_config?: Json
          rule_type: string
          table_name: string
          updated_at?: string | null
        }
        Update: {
          column_name?: string
          created_at?: string | null
          error_message?: string
          id?: string
          is_active?: boolean | null
          rule_config?: Json
          rule_type?: string
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_checksum: string | null
          id: string
          number: number
          org_id: string
          published_at: string | null
          status: string
          summary: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_checksum?: string | null
          id?: string
          number: number
          org_id: string
          published_at?: string | null
          status: string
          summary?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_checksum?: string | null
          id?: string
          number?: number
          org_id?: string
          published_at?: string | null
          status?: string
          summary?: Json | null
        }
        Relationships: []
      }
      witness_data: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          org_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          org_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          org_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_arpa_by_month: {
        Row: {
          arpa: number | null
          month: string | null
        }
        Relationships: []
      }
      v_burn_runway: {
        Row: {
          cogs: number | null
          month: string | null
          net_cash_flow: number | null
          opex: number | null
          revenue: number | null
        }
        Relationships: []
      }
      v_gross_margin: {
        Row: {
          cogs: number | null
          gm_pct: number | null
          month: string | null
          revenue: number | null
        }
        Relationships: []
      }
      v_mrr_by_month: {
        Row: {
          month: string | null
          revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      calculate_next_cleanup: {
        Args: { last_cleanup: string; retention_months: number }
        Returns: string
      }
      can_access_legal_data: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      can_access_sensitive_data: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      check_financial_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_rate_limit: {
        Args: { p_key: string; p_limit?: number; p_window_ms?: number }
        Returns: boolean
      }
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_staging: {
        Args: { p_import_job_id?: string }
        Returns: undefined
      }
      current_user_org_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      enhanced_log_user_action: {
        Args: {
          action_type: string
          metadata?: Json
          resource_id?: string
          resource_type?: string
        }
        Returns: undefined
      }
      ensure_user_profile: {
        Args: {
          org_id?: string
          user_email: string
          user_role?: Database["public"]["Enums"]["user_role"]
          user_uuid: string
        }
        Returns: {
          created_at: string
          data_access_level:
            | Database["public"]["Enums"]["data_access_level"]
            | null
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
      }
      execute_retention_cleanup: {
        Args: { p_policy_id: string }
        Returns: Json
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_arpa_by_month_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          arpa: number
          month: string
        }[]
      }
      get_beta_signups_secure: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          cargo: string
          created_at: string
          email: string
          id: string
          necessidades: string[]
          nome: string
          organizacao: string
          outro_texto: string
          total_count: number
          utm: Json
        }[]
      }
      get_burn_runway_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          cogs: number
          month: string
          net_cash_flow: number
          opex: number
          revenue: number
        }[]
      }
      get_current_user_org: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          data_access_level:
            | Database["public"]["Enums"]["data_access_level"]
            | null
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_enhanced_security_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_financial_dashboard_secure: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_financial_security_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_gross_margin_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          cogs: number
          gm_pct: number
          month: string
          revenue: number
        }[]
      }
      get_invoice_summary_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          paid_amount: number
          pending_amount: number
          total_invoices: number
          total_revenue: number
        }[]
      }
      get_mrr_by_month_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: string
          revenue: number
        }[]
      }
      get_next_version_number: {
        Args: { p_org_id: string }
        Returns: number
      }
      get_pessoas_with_access_control: {
        Args: { org_uuid?: string }
        Returns: {
          apelidos: string[]
          cpf_mask: string
          created_at: string
          id: string
          nome_civil: string
          org_id: string
          updated_at: string
        }[]
      }
      get_processos_live: {
        Args: { org_uuid?: string }
        Returns: {
          advogados_ativo: string[]
          advogados_passivo: string[]
          classificacao_final: string
          cnj: string
          cnj_digits: string
          cnj_normalizado: string
          comarca: string
          created_at: string
          data_audiencia: string
          deleted_at: string
          deleted_by: string
          fase: string
          id: string
          observacoes: string
          org_id: string
          prova_emprestada: boolean
          reclamante_cpf_mask: string
          reclamante_foi_testemunha: boolean
          reclamante_nome: string
          reu_nome: string
          score_risco: number
          status: string
          testemunhas_ativo: string[]
          testemunhas_passivo: string[]
          triangulacao_confirmada: boolean
          tribunal: string
          troca_direta: boolean
          updated_at: string
          vara: string
          version_id: string
        }[]
      }
      get_processos_public_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          advogados_ativo: string[]
          advogados_passivo: string[]
          classificacao_final: string
          cnj: string
          cnj_digits: string
          cnj_normalizado: string
          comarca: string
          created_at: string
          data_audiencia: string
          fase: string
          id: string
          observacoes: string
          org_id: string
          prova_emprestada: boolean
          reclamante_cpf_mask: string
          reclamante_foi_testemunha: boolean
          reclamante_nome: string
          reu_nome: string
          score_risco: number
          segredo_justica: boolean
          status: string
          testemunhas_ativo: string[]
          testemunhas_passivo: string[]
          triangulacao_confirmada: boolean
          tribunal: string
          troca_direta: boolean
          updated_at: string
          vara: string
          version_id: string
        }[]
      }
      get_processos_with_access_control: {
        Args: { org_uuid?: string }
        Returns: {
          advogados_ativo: string[]
          advogados_passivo: string[]
          classificacao_final: string
          cnj: string
          cnj_normalizado: string
          comarca: string
          created_at: string
          data_audiencia: string
          deleted_at: string
          deleted_by: string
          fase: string
          id: string
          observacoes: string
          org_id: string
          prova_emprestada: boolean
          reclamante_cpf_mask: string
          reclamante_foi_testemunha: boolean
          reclamante_nome: string
          reu_nome: string
          score_risco: number
          status: string
          testemunhas_ativo: string[]
          testemunhas_passivo: string[]
          triangulacao_confirmada: boolean
          tribunal: string
          troca_direta: boolean
          updated_at: string
          vara: string
          version_id: string
        }[]
      }
      get_secure_arpa_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_secure_arpa_monthly: {
        Args: Record<PropertyKey, never>
        Returns: {
          arpa: number
          month: string
        }[]
      }
      get_secure_burn_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_secure_financial_data: {
        Args: { view_name: string }
        Returns: Json
      }
      get_secure_gross_margin: {
        Args: Record<PropertyKey, never>
        Returns: {
          cogs: number
          gm_pct: number
          month: string
          revenue: number
        }[]
      }
      get_secure_margin_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_secure_mrr_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_secure_mrr_monthly: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: string
          revenue: number
        }[]
      }
      get_secure_processos: {
        Args: Record<PropertyKey, never>
        Returns: {
          classificacao_final: string
          cnj: string
          cnj_normalizado: string
          comarca: string
          created_at: string
          data_audiencia: string
          fase: string
          id: string
          org_id: string
          reclamante_nome: string
          reu_nome: string
          score_risco: number
          status: string
          tribunal: string
          updated_at: string
          vara: string
        }[]
      }
      get_security_audit_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_security_monitoring_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_security_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_org_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_financial_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_simple: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_org_admin_simple: {
        Args: { check_org_id: string }
        Returns: boolean
      }
      log_audit: {
        Args: {
          p_action: string
          p_new: Json
          p_old: Json
          p_record: string
          p_table: string
        }
        Returns: undefined
      }
      log_data_access: {
        Args: {
          p_access_type?: string
          p_record_ids?: string[]
          p_table_name: string
        }
        Returns: undefined
      }
      log_financial_access: {
        Args: { access_type: string; data_type: string }
        Returns: undefined
      }
      log_financial_data_access: {
        Args: { p_action?: string; p_table_name: string }
        Returns: undefined
      }
      log_legal_data_access: {
        Args: {
          p_access_type: string
          p_metadata?: Json
          p_org_id: string
          p_record_count?: number
          p_table_name: string
        }
        Returns: undefined
      }
      log_user_action: {
        Args: {
          action_type: string
          metadata?: Json
          resource_id?: string
          resource_type?: string
        }
        Returns: undefined
      }
      mask_cpf: {
        Args: { cpf_value: string }
        Returns: string
      }
      mask_name: {
        Args: { name_value: string }
        Returns: string
      }
      requires_mfa_verification: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      rpc_cleanup_derived_data: {
        Args: { p_org_id: string }
        Returns: Json
      }
      rpc_cleanup_duplicates: {
        Args: { p_org_id: string }
        Returns: Json
      }
      rpc_cleanup_empty_required_fields: {
        Args: { p_org_id: string }
        Returns: Json
      }
      rpc_cleanup_hard_delete_old: {
        Args: { p_org_id: string }
        Returns: Json
      }
      rpc_cleanup_invalid_cnjs: {
        Args: { p_org_id: string }
        Returns: Json
      }
      rpc_cleanup_normalize_cnjs: {
        Args: { p_org_id: string }
        Returns: Json
      }
      rpc_delete_all_processos: {
        Args: { p_hard_delete?: boolean; p_org_id: string }
        Returns: Json
      }
      rpc_get_assistjur_processos: {
        Args: {
          p_filters?: Json
          p_limit?: number
          p_org_id: string
          p_page?: number
        }
        Returns: {
          data: Json
          total_count: number
        }[]
      }
      rpc_get_assistjur_stats: {
        Args: { p_org_id: string }
        Returns: Json
      }
      rpc_get_assistjur_testemunhas: {
        Args: {
          p_filters?: Json
          p_limit?: number
          p_org_id: string
          p_page?: number
        }
        Returns: {
          data: Json
          total_count: number
        }[]
      }
      rpc_get_cleanup_preview: {
        Args: { p_org_id: string }
        Returns: Json
      }
      rpc_get_deletion_impact: {
        Args: { p_org_id: string }
        Returns: Json
      }
      rpc_restore_all_processos: {
        Args: { p_org_id: string }
        Returns: Json
      }
      safe_fn: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      sanitize_input: {
        Args: { input_text: string }
        Returns: string
      }
      secure_financial_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      secure_insert_beta_signup: {
        Args: {
          p_cargo: string
          p_email: string
          p_necessidades: string[]
          p_nome: string
          p_organizacao: string
          p_outro_texto: string
          p_utm: Json
        }
        Returns: Json
      }
      security_maintenance_reminder: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      setup_default_retention_policies: {
        Args: { p_org_id: string }
        Returns: undefined
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      test_anonymous_access: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      upsert_padroes_agregados: {
        Args: { p_data: Json; p_org_id: string }
        Returns: undefined
      }
      upsert_staging_to_final: {
        Args: { p_import_job_id?: string; p_org_id: string }
        Returns: {
          error_count: number
          inserted_count: number
          updated_count: number
        }[]
      }
      validate_final_security_state: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_org_access: {
        Args: Record<PropertyKey, never> | { target_org_id: string }
        Returns: boolean
      }
      validate_security_fixes: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_financial_protection: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      verify_invoice_security: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_org_consistency: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_tenant_isolation: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      app_role: "ADMIN" | "ANALYST" | "VIEWER"
      data_access_level: "FULL" | "MASKED" | "NONE"
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
      app_role: ["ADMIN", "ANALYST", "VIEWER"],
      data_access_level: ["FULL", "MASKED", "NONE"],
      user_role: ["ADMIN", "ANALYST", "VIEWER"],
    },
  },
} as const
