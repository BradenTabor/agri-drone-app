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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          id: string
          identifier: string
          notes: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          identifier: string
          notes?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          identifier?: string
          notes?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fields: {
        Row: {
          acres: number | null
          boundary: Json | null
          created_at: string
          customer_id: string
          default_lat: number | null
          default_lng: number | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          acres?: number | null
          boundary?: Json | null
          created_at?: string
          customer_id: string
          default_lat?: number | null
          default_lng?: number | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          acres?: number | null
          boundary?: Json | null
          created_at?: string
          customer_id?: string
          default_lat?: number | null
          default_lng?: number | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fields_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_record_photos: {
        Row: {
          caption: string | null
          created_at: string
          deleted_at: string | null
          id: string
          mix_record_id: string
          storage_path: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          mix_record_id: string
          storage_path: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          mix_record_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mix_record_photos_mix_record_id_fkey"
            columns: ["mix_record_id"]
            isOneToOne: false
            referencedRelation: "mix_records"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_record_equipment: {
        Row: {
          created_at: string
          deleted_at: string | null
          equipment_id: string
          id: string
          mix_record_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          equipment_id: string
          id?: string
          mix_record_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          equipment_id?: string
          id?: string
          mix_record_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mix_record_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_record_equipment_mix_record_id_fkey"
            columns: ["mix_record_id"]
            isOneToOne: false
            referencedRelation: "mix_records"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_record_products: {
        Row: {
          amount_added: number
          amount_unit: string
          created_at: string
          deleted_at: string | null
          id: string
          mix_record_id: string
          product_id: string | null
          rate_per_acre: number | null
          rate_unit: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount_added: number
          amount_unit: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          mix_record_id: string
          product_id?: string | null
          rate_per_acre?: number | null
          rate_unit?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount_added?: number
          amount_unit?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          mix_record_id?: string
          product_id?: string | null
          rate_per_acre?: number | null
          rate_unit?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mix_record_products_mix_record_id_fkey"
            columns: ["mix_record_id"]
            isOneToOne: false
            referencedRelation: "mix_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_record_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_records: {
        Row: {
          actual_acres: number | null
          applicator_id: string | null
          applicator_name_override: string | null
          created_at: string
          customer_id: string
          customer_name_snapshot: string | null
          deleted_at: string | null
          equipment_id: string | null
          expected_acres: number
          field_id: string
          field_name_snapshot: string | null
          humidity_pct: number | null
          id: string
          last_modified_at: string | null
          last_modified_by: string | null
          license_cert_no: string | null
          mix_lat: number
          mix_lng: number
          notes: string | null
          record_date: string
          search_vector: unknown
          signature_attested: boolean
          signed_typed_name: string
          submitted_at: string
          submitted_by: string | null
          surfactant_amount: number | null
          surfactant_name: string | null
          surfactant_unit: string | null
          tank_size_gal: number
          target_gpa: number
          temp_f: number | null
          time_mixed: string
          total_mix_gal: number
          updated_at: string
          water_gal: number
          wind_direction: string
          wind_speed_mph: number
        }
        Insert: {
          actual_acres?: number | null
          applicator_id?: string | null
          applicator_name_override?: string | null
          created_at?: string
          customer_id: string
          customer_name_snapshot?: string | null
          deleted_at?: string | null
          equipment_id?: string | null
          expected_acres: number
          field_id: string
          field_name_snapshot?: string | null
          humidity_pct?: number | null
          id?: string
          last_modified_at?: string | null
          last_modified_by?: string | null
          license_cert_no?: string | null
          mix_lat: number
          mix_lng: number
          notes?: string | null
          record_date: string
          search_vector?: unknown
          signature_attested?: boolean
          signed_typed_name: string
          submitted_at?: string
          submitted_by?: string | null
          surfactant_amount?: number | null
          surfactant_name?: string | null
          surfactant_unit?: string | null
          tank_size_gal: number
          target_gpa: number
          temp_f?: number | null
          time_mixed: string
          total_mix_gal: number
          updated_at?: string
          water_gal: number
          wind_direction: string
          wind_speed_mph: number
        }
        Update: {
          actual_acres?: number | null
          applicator_id?: string | null
          applicator_name_override?: string | null
          created_at?: string
          customer_id?: string
          customer_name_snapshot?: string | null
          deleted_at?: string | null
          equipment_id?: string | null
          expected_acres?: number
          field_id?: string
          field_name_snapshot?: string | null
          humidity_pct?: number | null
          id?: string
          last_modified_at?: string | null
          last_modified_by?: string | null
          license_cert_no?: string | null
          mix_lat?: number
          mix_lng?: number
          notes?: string | null
          record_date?: string
          search_vector?: unknown
          signature_attested?: boolean
          signed_typed_name?: string
          submitted_at?: string
          submitted_by?: string | null
          surfactant_amount?: number | null
          surfactant_name?: string | null
          surfactant_unit?: string | null
          tank_size_gal?: number
          target_gpa?: number
          temp_f?: number | null
          time_mixed?: string
          total_mix_gal?: number
          updated_at?: string
          water_gal?: number
          wind_direction?: string
          wind_speed_mph?: number
        }
        Relationships: [
          {
            foreignKeyName: "mix_records_applicator_id_fkey"
            columns: ["applicator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_records_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_records_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_records_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          documents: Json
          epa_number: string | null
          id: string
          label_max_rate: number | null
          label_min_rate: number | null
          manufacturer: string | null
          name: string
          notes: string | null
          rate_unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          documents?: Json
          epa_number?: string | null
          id?: string
          label_max_rate?: number | null
          label_min_rate?: number | null
          manufacturer?: string | null
          name: string
          notes?: string | null
          rate_unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          documents?: Json
          epa_number?: string | null
          id?: string
          label_max_rate?: number | null
          label_min_rate?: number | null
          manufacturer?: string | null
          name?: string
          notes?: string | null
          rate_unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_units: string
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string
          license_cert_no: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_units?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          license_cert_no?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_units?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          license_cert_no?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string
          deleted_at: string | null
          filters: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          filters?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_filters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_mix_record_with_lines: {
        Args: { p_lines: Json; p_record: Json }
        Returns: string
      }
      current_user_role: { Args: never; Returns: string }
      update_mix_record_with_lines: {
        Args: { p_lines: Json; p_record: Json; p_record_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
