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
  public: {
    Tables: {
      lead_activities: {
        Row: {
          created_at: string
          description: string
          id: string
          lead_id: string
          metadata: Json | null
          tenant_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          lead_id: string
          metadata?: Json | null
          tenant_id: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          tenant_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          closed_at: string | null
          contacted_at: string | null
          created_at: string
          email: string | null
          id: string
          ip_address: unknown
          kanban_position: number
          message: string | null
          name: string
          notes: string | null
          phone: string
          seller_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          vehicle_id: string | null
        }
        Insert: {
          closed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown
          kanban_position?: number
          message?: string | null
          name: string
          notes?: string | null
          phone: string
          seller_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_id?: string | null
        }
        Update: {
          closed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown
          kanban_position?: number
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string
          seller_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "public_vehicle_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklists: {
        Row: {
          added_seller: boolean
          added_vehicle: boolean
          completed_at: string | null
          configured_whatsapp: boolean
          created_at: string
          id: string
          published_store: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          added_seller?: boolean
          added_vehicle?: boolean
          completed_at?: string | null
          configured_whatsapp?: boolean
          created_at?: string
          id?: string
          published_store?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          added_seller?: boolean
          added_vehicle?: boolean
          completed_at?: string | null
          configured_whatsapp?: boolean
          created_at?: string
          id?: string
          published_store?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          display_name: string
          features: Json
          id: string
          is_active: boolean
          max_leads: number
          max_users: number
          max_vehicles: number
          name: Database["public"]["Enums"]["plan_type"]
          price_monthly: number
          price_yearly: number
        }
        Insert: {
          created_at?: string
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean
          max_leads: number
          max_users: number
          max_vehicles: number
          name: Database["public"]["Enums"]["plan_type"]
          price_monthly?: number
          price_yearly?: number
        }
        Update: {
          created_at?: string
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_leads?: number
          max_users?: number
          max_vehicles?: number
          name?: Database["public"]["Enums"]["plan_type"]
          price_monthly?: number
          price_yearly?: number
        }
        Relationships: []
      }
      sellers: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          phone_whatsapp: string
          photo_url: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          phone_whatsapp: string
          photo_url?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          phone_whatsapp?: string
          photo_url?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sellers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          external_id: string | null
          id: string
          metadata: Json | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: Json | null
          created_at: string
          custom_domain: string | null
          description: string | null
          email: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone_whatsapp: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          social_links: Json | null
          theme: Json | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          email: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone_whatsapp: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          social_links?: Json | null
          theme?: Json | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          email?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone_whatsapp?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          social_links?: Json | null
          theme?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_snapshots: {
        Row: {
          id: string
          leads_count: number
          snapped_at: string
          tenant_id: string
          users_count: number
          vehicles_count: number
        }
        Insert: {
          id?: string
          leads_count?: number
          snapped_at?: string
          tenant_id: string
          users_count?: number
          vehicles_count?: number
        }
        Update: {
          id?: string
          leads_count?: number
          snapped_at?: string
          tenant_id?: string
          users_count?: number
          vehicles_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          color: string | null
          condition: Database["public"]["Enums"]["vehicle_condition"]
          created_at: string
          description: string | null
          doors: number | null
          engine: string | null
          features: string[] | null
          fipe_price: number | null
          fuel: Database["public"]["Enums"]["fuel_type"]
          horsepower: number | null
          id: string
          images: string[] | null
          is_featured: boolean
          leads_count: number
          mileage: number
          model: string
          plate_last_digits: string | null
          price: number
          price_negotiable: boolean
          seller_id: string | null
          slug: string
          status: Database["public"]["Enums"]["vehicle_status"]
          tenant_id: string
          thumbnail_url: string | null
          title: string
          transmission: Database["public"]["Enums"]["transmission_type"]
          updated_at: string
          version: string | null
          video_url: string | null
          views_count: number
          year_manufacture: number
          year_model: number
        }
        Insert: {
          brand: string
          color?: string | null
          condition?: Database["public"]["Enums"]["vehicle_condition"]
          created_at?: string
          description?: string | null
          doors?: number | null
          engine?: string | null
          features?: string[] | null
          fipe_price?: number | null
          fuel?: Database["public"]["Enums"]["fuel_type"]
          horsepower?: number | null
          id?: string
          images?: string[] | null
          is_featured?: boolean
          leads_count?: number
          mileage?: number
          model: string
          plate_last_digits?: string | null
          price: number
          price_negotiable?: boolean
          seller_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tenant_id: string
          thumbnail_url?: string | null
          title: string
          transmission?: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
          version?: string | null
          video_url?: string | null
          views_count?: number
          year_manufacture: number
          year_model: number
        }
        Update: {
          brand?: string
          color?: string | null
          condition?: Database["public"]["Enums"]["vehicle_condition"]
          created_at?: string
          description?: string | null
          doors?: number | null
          engine?: string | null
          features?: string[] | null
          fipe_price?: number | null
          fuel?: Database["public"]["Enums"]["fuel_type"]
          horsepower?: number | null
          id?: string
          images?: string[] | null
          is_featured?: boolean
          leads_count?: number
          mileage?: number
          model?: string
          plate_last_digits?: string | null
          price?: number
          price_negotiable?: boolean
          seller_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tenant_id?: string
          thumbnail_url?: string | null
          title?: string
          transmission?: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
          version?: string | null
          video_url?: string | null
          views_count?: number
          year_manufacture?: number
          year_model?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_vehicle_listings: {
        Row: {
          brand: string | null
          color: string | null
          condition: Database["public"]["Enums"]["vehicle_condition"] | null
          created_at: string | null
          description: string | null
          doors: number | null
          engine: string | null
          features: string[] | null
          fipe_price: number | null
          fuel: Database["public"]["Enums"]["fuel_type"] | null
          horsepower: number | null
          id: string | null
          images: string[] | null
          leads_count: number | null
          mileage: number | null
          model: string | null
          price: number | null
          price_negotiable: boolean | null
          slug: string | null
          store_logo: string | null
          store_name: string | null
          store_slug: string | null
          store_whatsapp: string | null
          tenant_id: string | null
          thumbnail_url: string | null
          title: string | null
          transmission: Database["public"]["Enums"]["transmission_type"] | null
          version: string | null
          video_url: string | null
          views_count: number | null
          year_manufacture: number | null
          year_model: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_tenant_id: { Args: never; Returns: string }
      auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_tenant_usage: {
        Args: { p_tenant_id: string }
        Returns: {
          leads_count: number
          max_leads: number
          max_users: number
          max_vehicles: number
          plan_display: string
          plan_name: Database["public"]["Enums"]["plan_type"]
          sub_status: Database["public"]["Enums"]["subscription_status"]
          users_count: number
          users_pct: number
          vehicles_count: number
          vehicles_pct: number
        }[]
      }
    }
    Enums: {
      fuel_type:
        | "flex"
        | "gasoline"
        | "diesel"
        | "electric"
        | "hybrid"
        | "ethanol"
      lead_source:
        | "marketplace"
        | "whatsapp"
        | "referral"
        | "direct"
        | "social"
        | "other"
      lead_status:
        | "new"
        | "in_progress"
        | "proposal"
        | "closed_won"
        | "closed_lost"
      plan_type: "starter" | "pro" | "premium" | "enterprise"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "paused"
      transmission_type: "manual" | "automatic" | "cvt" | "automated"
      user_role: "owner" | "admin" | "seller" | "viewer"
      vehicle_condition: "new" | "used" | "certified"
      vehicle_status: "available" | "reserved" | "sold" | "inactive"
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
      fuel_type: [
        "flex",
        "gasoline",
        "diesel",
        "electric",
        "hybrid",
        "ethanol",
      ],
      lead_source: [
        "marketplace",
        "whatsapp",
        "referral",
        "direct",
        "social",
        "other",
      ],
      lead_status: [
        "new",
        "in_progress",
        "proposal",
        "closed_won",
        "closed_lost",
      ],
      plan_type: ["starter", "pro", "premium", "enterprise"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "paused",
      ],
      transmission_type: ["manual", "automatic", "cvt", "automated"],
      user_role: ["owner", "admin", "seller", "viewer"],
      vehicle_condition: ["new", "used", "certified"],
      vehicle_status: ["available", "reserved", "sold", "inactive"],
    },
  },
} as const
