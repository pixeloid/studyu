export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      blocked_dates: {
        Row: {
          created_at: string | null
          date: string
          id: string
          reason: string | null
          time_slot_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          reason?: string | null
          time_slot_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          reason?: string | null
          time_slot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_extras: {
        Row: {
          booking_id: string
          created_at: string | null
          extra_id: string
          id: string
          quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          extra_id: string
          id?: string
          quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          extra_id?: string
          id?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_extras_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_extras_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "extras"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin_notes: string | null
          base_price: number
          booking_date: string
          cancellation_fee: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string | null
          discount_amount: number | null
          discount_percent: number | null
          extras_price: number | null
          google_calendar_event_id: string | null
          id: string
          invoice_id: string | null
          invoice_number: string | null
          invoice_url: string | null
          paid_at: string | null
          proforma_number: string | null
          proforma_sent_at: string | null
          proforma_url: string | null
          status: string
          time_slot_id: string
          total_price: number
          updated_at: string | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          base_price: number
          booking_date: string
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          extras_price?: number | null
          google_calendar_event_id?: string | null
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          paid_at?: string | null
          proforma_number?: string | null
          proforma_sent_at?: string | null
          proforma_url?: string | null
          status?: string
          time_slot_id: string
          total_price: number
          updated_at?: string | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          base_price?: number
          booking_date?: string
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          extras_price?: number | null
          google_calendar_event_id?: string | null
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          paid_at?: string | null
          proforma_number?: string | null
          proforma_sent_at?: string | null
          proforma_url?: string | null
          status?: string
          time_slot_id?: string
          total_price?: number
          updated_at?: string | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_percent: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      extras: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          price_type: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          price_type?: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          price_type?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      internal_blocks: {
        Row: {
          block_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_datetime: string
          id: string
          is_recurring: boolean | null
          recurrence_rule: string | null
          start_datetime: string
          title: string
        }
        Insert: {
          block_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime: string
          id?: string
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          start_datetime: string
          title: string
        }
        Update: {
          block_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime?: string
          id?: string
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          start_datetime?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          close_time: string
          created_at: string | null
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string
          updated_at: string | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          close_time: string
          created_at?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time: string
          updated_at?: string | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_address: Json | null
          company_name: string | null
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          role: string | null
          tax_number: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          company_name?: string | null
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          role?: string | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      special_dates: {
        Row: {
          close_time: string | null
          created_at: string | null
          date: string
          id: string
          name: string | null
          open_time: string | null
          reason: string | null
          type: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string | null
          date: string
          id?: string
          name?: string | null
          open_time?: string | null
          reason?: string | null
          type: string
        }
        Update: {
          close_time?: string | null
          created_at?: string | null
          date?: string
          id?: string
          name?: string | null
          open_time?: string | null
          reason?: string | null
          type?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          base_price: number
          created_at: string | null
          duration_hours: number
          end_time: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          start_time: string
        }
        Insert: {
          base_price: number
          created_at?: string | null
          duration_hours: number
          end_time: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          start_time: string
        }
        Update: {
          base_price?: number
          created_at?: string | null
          duration_hours?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          start_time?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_coupon_usage: {
        Args: { coupon_id_input: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      validate_coupon: {
        Args: { coupon_code_input: string }
        Returns: {
          code: string
          coupon_id: string
          discount_percent: number
          error_message: string
          is_valid: boolean
        }[]
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

