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
      app_record_pesticides: {
        Row: {
          active_ingredient: string | null
          app_record_id: string
          created_at: string
          epa_reg_number: string | null
          id: string
          is_surfactant: boolean
          product_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active_ingredient?: string | null
          app_record_id: string
          created_at?: string
          epa_reg_number?: string | null
          id?: string
          is_surfactant?: boolean
          product_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active_ingredient?: string | null
          app_record_id?: string
          created_at?: string
          epa_reg_number?: string | null
          id?: string
          is_surfactant?: boolean
          product_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_record_pesticides_app_record_id_fkey"
            columns: ["app_record_id"]
            isOneToOne: false
            referencedRelation: "app_records"
            referencedColumns: ["id"]
          },
        ]
      }
      app_record_mix_records: {
        Row: {
          app_record_id: string
          created_at: string
          id: string
          mix_record_id: string
          sort_order: number
        }
        Insert: {
          app_record_id: string
          created_at?: string
          id?: string
          mix_record_id: string
          sort_order?: number
        }
        Update: {
          app_record_id?: string
          created_at?: string
          id?: string
          mix_record_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_record_mix_records_app_record_id_fkey"
            columns: ["app_record_id"]
            isOneToOne: false
            referencedRelation: "app_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_record_mix_records_mix_record_id_fkey"
            columns: ["mix_record_id"]
            isOneToOne: false
            referencedRelation: "mix_records"
            referencedColumns: ["id"]
          },
        ]
      }
      app_records: {
        Row: {
          acres_treated: number | null
          additional_notes: string | null
          app_method: string | null
          app_type: string | null
          applicator_name: string
          applicator_sig: string | null
          cert_attested: boolean
          created_at: string
          customer_name: string
          deleted_at: string | null
          end_time: string | null
          equipment_notes: string | null
          gallons_per_acre: number | null
          id: string
          job_date: string
          job_site_id: string | null
          last_modified_at: string | null
          last_modified_by: string | null
          license_cert_no: string | null
          location_lat: number | null
          location_lng: number | null
          nozzle_type: string | null
          rei: string | null
          safe_reentry_date: string | null
          site_address: string | null
          sky_condition: string | null
          start_time: string | null
          submitted_at: string
          submitted_by: string | null
          tank_mix_record: string | null
          target_veg_other: string | null
          target_vegetation: Json
          temp_f: number | null
          total_gallons: number | null
          truck_id: string | null
          updated_at: string
          wind_direction: string | null
          wind_speed_mph: number | null
        }
        Insert: {
          acres_treated?: number | null
          additional_notes?: string | null
          app_method?: string | null
          app_type?: string | null
          applicator_name: string
          applicator_sig?: string | null
          cert_attested?: boolean
          created_at?: string
          customer_name: string
          deleted_at?: string | null
          end_time?: string | null
          equipment_notes?: string | null
          gallons_per_acre?: number | null
          id?: string
          job_date: string
          job_site_id?: string | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          license_cert_no?: string | null
          location_lat?: number | null
          location_lng?: number | null
          nozzle_type?: string | null
          rei?: string | null
          safe_reentry_date?: string | null
          site_address?: string | null
          sky_condition?: string | null
          start_time?: string | null
          submitted_at?: string
          submitted_by?: string | null
          tank_mix_record?: string | null
          target_veg_other?: string | null
          target_vegetation?: Json
          temp_f?: number | null
          total_gallons?: number | null
          truck_id?: string | null
          updated_at?: string
          wind_direction?: string | null
          wind_speed_mph?: number | null
        }
        Update: {
          acres_treated?: number | null
          additional_notes?: string | null
          app_method?: string | null
          app_type?: string | null
          applicator_name?: string
          applicator_sig?: string | null
          cert_attested?: boolean
          created_at?: string
          customer_name?: string
          deleted_at?: string | null
          end_time?: string | null
          equipment_notes?: string | null
          gallons_per_acre?: number | null
          id?: string
          job_date?: string
          job_site_id?: string | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          license_cert_no?: string | null
          location_lat?: number | null
          location_lng?: number | null
          nozzle_type?: string | null
          rei?: string | null
          safe_reentry_date?: string | null
          site_address?: string | null
          sky_condition?: string | null
          start_time?: string | null
          submitted_at?: string
          submitted_by?: string | null
          tank_mix_record?: string | null
          target_veg_other?: string | null
          target_vegetation?: Json
          temp_f?: number | null
          total_gallons?: number | null
          truck_id?: string | null
          updated_at?: string
          wind_direction?: string | null
          wind_speed_mph?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_records_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_records_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      form_drafts: {
        Row: {
          created_at: string
          form_type: string
          id: string
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          form_type: string
          id?: string
          payload: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          form_type?: string
          id?: string
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      pricing_config: {
        Row: {
          aerial_rate_per_acre: number | null
          created_at: string
          id: string
          markup_cap: number | null
          minimum_job_fee: number | null
          payment_terms: string | null
          product_markup_pct: number | null
          setup_fee: number | null
          special_rates: Json
          travel_fee_per_mile: number | null
          updated_at: string
        }
        Insert: {
          aerial_rate_per_acre?: number | null
          created_at?: string
          id?: string
          markup_cap?: number | null
          minimum_job_fee?: number | null
          payment_terms?: string | null
          product_markup_pct?: number | null
          setup_fee?: number | null
          special_rates?: Json
          travel_fee_per_mile?: number | null
          updated_at?: string
        }
        Update: {
          aerial_rate_per_acre?: number | null
          created_at?: string
          id?: string
          markup_cap?: number | null
          minimum_job_fee?: number | null
          payment_terms?: string | null
          product_markup_pct?: number | null
          setup_fee?: number | null
          special_rates?: Json
          travel_fee_per_mile?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          cost_unit: string | null
          created_at: string
          deleted_at: string | null
          documents: Json
          epa_number: string | null
          id: string
          ingredients: string[]
          manufacturer: string | null
          name: string
          notes: string | null
          retail_cost: number | null
          restricted_use: boolean
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cost_unit?: string | null
          created_at?: string
          deleted_at?: string | null
          documents?: Json
          epa_number?: string | null
          id?: string
          ingredients?: string[]
          manufacturer?: string | null
          name: string
          notes?: string | null
          retail_cost?: number | null
          restricted_use?: boolean
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cost_unit?: string | null
          created_at?: string
          deleted_at?: string | null
          documents?: Json
          epa_number?: string | null
          id?: string
          ingredients?: string[]
          manufacturer?: string | null
          name?: string
          notes?: string | null
          retail_cost?: number | null
          restricted_use?: boolean
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      surfactants: {
        Row: {
          active: boolean
          cost_unit: string | null
          created_at: string
          default_unit: string | null
          deleted_at: string | null
          epa_number: string | null
          id: string
          manufacturer: string | null
          name: string
          notes: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cost_unit?: string | null
          created_at?: string
          default_unit?: string | null
          deleted_at?: string | null
          epa_number?: string | null
          id?: string
          manufacturer?: string | null
          name: string
          notes?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cost_unit?: string | null
          created_at?: string
          default_unit?: string | null
          deleted_at?: string | null
          epa_number?: string | null
          id?: string
          manufacturer?: string | null
          name?: string
          notes?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          data_consent_at: string | null
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
          data_consent_at?: string | null
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
          data_consent_at?: string | null
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
      quote_line_items: {
        Row: {
          amount: number
          basis: string
          created_at: string
          description: string
          id: string
          kind: string
          product_id: string | null
          quantity: number
          quote_id: string
          sort_order: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount?: number
          basis?: string
          created_at?: string
          description: string
          id?: string
          kind?: string
          product_id?: string | null
          quantity?: number
          quote_id: string
          sort_order?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          basis?: string
          created_at?: string
          description?: string
          id?: string
          kind?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          sort_order?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          acres: number | null
          adjuvant_surfactant: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string
          deleted_at: string | null
          field_id: string | null
          id: string
          mileage: number | null
          notes: string | null
          other_amount: number
          other_label: string | null
          price_per_acre: number | null
          quote_date: string
          quote_number: string | null
          service_for: string | null
          source_app_record_id: string | null
          status: string
          subtotal: number
          tax_rate: number
          terms: string | null
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          acres?: number | null
          adjuvant_surfactant?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          deleted_at?: string | null
          field_id?: string | null
          id?: string
          mileage?: number | null
          notes?: string | null
          other_amount?: number
          other_label?: string | null
          price_per_acre?: number | null
          quote_date: string
          quote_number?: string | null
          service_for?: string | null
          source_app_record_id?: string | null
          status?: string
          subtotal?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          acres?: number | null
          adjuvant_surfactant?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          deleted_at?: string | null
          field_id?: string | null
          id?: string
          mileage?: number | null
          notes?: string | null
          other_amount?: number
          other_label?: string | null
          price_per_acre?: number | null
          quote_date?: string
          quote_number?: string | null
          service_for?: string | null
          source_app_record_id?: string | null
          status?: string
          subtotal?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_source_app_record_id_fkey"
            columns: ["source_app_record_id"]
            isOneToOne: false
            referencedRelation: "app_records"
            referencedColumns: ["id"]
          },
        ]
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
      create_app_record_with_children: {
        Args: { p_mix_record_ids: Json; p_pesticides: Json; p_record: Json }
        Returns: string
      }
      create_mix_record_with_lines: {
        Args: { p_lines: Json; p_record: Json }
        Returns: string
      }
      current_user_role: { Args: never; Returns: string }
      update_app_record_with_children: {
        Args: {
          p_mix_record_ids: Json
          p_pesticides: Json
          p_record: Json
          p_record_id: string
        }
        Returns: undefined
      }
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
