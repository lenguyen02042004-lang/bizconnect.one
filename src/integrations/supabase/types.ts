export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          value: Json;
        };
        Insert: {
          key: string;
          value: Json;
        };
        Update: {
          key?: string;
          value?: Json;
        };
        Relationships: [];
      };
      business_claims: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          proof_text: string;
          status: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          proof_text: string;
          status?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          proof_text?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_claims_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_gallery: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          image_url: string;
          order_index: number;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          image_url: string;
          order_index?: number;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          image_url?: string;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "business_gallery_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_socials: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          platform: string;
          url: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          platform: string;
          url: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          platform?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_socials_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          address: string | null;
          banner_url: string | null;
          certifications: Json;
          country_code: string | null;
          created_at: string;
          description: string | null;
          email: string | null;
          followers_count: number;
          icon_tier: Database["public"]["Enums"]["icon_tier"];
          id: string;
          industry_id: string | null;
          is_claimed: boolean;
          lat: number | null;
          lng: number | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          premium_until: string | null;
          province: string | null;
          qr_scans_count: number;
          shares_count: number;
          short_intro: string | null;
          slug: string;
          status: Database["public"]["Enums"]["business_status"];
          updated_at: string;
          views_count: number;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          banner_url?: string | null;
          certifications?: Json;
          country_code?: string | null;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          followers_count?: number;
          icon_tier?: Database["public"]["Enums"]["icon_tier"];
          id?: string;
          industry_id?: string | null;
          is_claimed?: boolean;
          lat?: number | null;
          lng?: number | null;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          premium_until?: string | null;
          province?: string | null;
          qr_scans_count?: number;
          shares_count?: number;
          short_intro?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["business_status"];
          updated_at?: string;
          views_count?: number;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          banner_url?: string | null;
          certifications?: Json;
          country_code?: string | null;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          followers_count?: number;
          icon_tier?: Database["public"]["Enums"]["icon_tier"];
          id?: string;
          industry_id?: string | null;
          is_claimed?: boolean;
          lat?: number | null;
          lng?: number | null;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          premium_until?: string | null;
          province?: string | null;
          qr_scans_count?: number;
          shares_count?: number;
          short_intro?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["business_status"];
          updated_at?: string;
          views_count?: number;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_country_code_fkey";
            columns: ["country_code"];
            isOneToOne: false;
            referencedRelation: "countries";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "businesses_industry_id_fkey";
            columns: ["industry_id"];
            isOneToOne: false;
            referencedRelation: "industries";
            referencedColumns: ["id"];
          },
        ];
      };
      connect_messages: {
        Row: {
          body: string | null;
          created_at: string;
          from_business_id: string | null;
          from_user_id: string | null;
          id: string;
          read_at: string | null;
          subject: string | null;
          to_business_id: string | null;
          to_user_id: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          from_business_id?: string | null;
          from_user_id?: string | null;
          id?: string;
          read_at?: string | null;
          subject?: string | null;
          to_business_id?: string | null;
          to_user_id?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          from_business_id?: string | null;
          from_user_id?: string | null;
          id?: string;
          read_at?: string | null;
          subject?: string | null;
          to_business_id?: string | null;
          to_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "connect_messages_from_business_id_fkey";
            columns: ["from_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "connect_messages_to_business_id_fkey";
            columns: ["to_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      connections: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          requester_id: string;
          source: string;
          status: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          requester_id: string;
          source?: string;
          status?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          requester_id?: string;
          source?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "connections_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_submissions: {
        Row: {
          company: string | null;
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
        };
        Insert: {
          company?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
        };
        Update: {
          company?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
        };
        Relationships: [];
      };
      countries: {
        Row: {
          code: string;
          created_at: string;
          flag: string | null;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          flag?: string | null;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          flag?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          business_id: string;
          created_at: string;
          follower_id: string;
          id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          follower_id: string;
          id?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          follower_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      industries: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      message_quotas: {
        Row: {
          bonus_credits: number;
          created_at: string;
          id: string;
          period_year: number;
          updated_at: string;
          used_count: number;
          user_id: string;
        };
        Insert: {
          bonus_credits?: number;
          created_at?: string;
          id?: string;
          period_year: number;
          updated_at?: string;
          used_count?: number;
          user_id: string;
        };
        Update: {
          bonus_credits?: number;
          created_at?: string;
          id?: string;
          period_year?: number;
          updated_at?: string;
          used_count?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      payments_log: {
        Row: {
          amount: number;
          business_id: string | null;
          created_at: string;
          currency: string;
          id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_payment_id: string | null;
          receipt_url: string | null;
          status: string;
          type: Database["public"]["Enums"]["payment_type"];
          user_id: string;
        };
        Insert: {
          amount: number;
          business_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_payment_id?: string | null;
          receipt_url?: string | null;
          status?: string;
          type: Database["public"]["Enums"]["payment_type"];
          user_id: string;
        };
        Update: {
          amount?: number;
          business_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_payment_id?: string | null;
          receipt_url?: string | null;
          status?: string;
          type?: Database["public"]["Enums"]["payment_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_log_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      personal_profiles: {
        Row: {
          avatar_url: string | null;
          company_name: string | null;
          created_at: string;
          email: string | null;
          facebook_url: string | null;
          followers_count: number;
          full_name: string;
          id: string;
          is_public: boolean;
          job_title: string | null;
          linkedin_url: string | null;
          phone: string | null;
          slug: string;
          updated_at: string;
          user_id: string;
          views_count: number;
          zalo: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          facebook_url?: string | null;
          followers_count?: number;
          full_name: string;
          id?: string;
          is_public?: boolean;
          job_title?: string | null;
          linkedin_url?: string | null;
          phone?: string | null;
          slug: string;
          updated_at?: string;
          user_id: string;
          views_count?: number;
          zalo?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          facebook_url?: string | null;
          followers_count?: number;
          full_name?: string;
          id?: string;
          is_public?: boolean;
          job_title?: string | null;
          linkedin_url?: string | null;
          phone?: string | null;
          slug?: string;
          updated_at?: string;
          user_id?: string;
          views_count?: number;
          zalo?: string | null;
        };
        Relationships: [];
      };
      platform_contacts: {
        Row: {
          company: string | null;
          created_at: string | null;
          email: string;
          id: string;
          is_read: boolean | null;
          message: string;
          name: string;
          phone: string | null;
        };
        Insert: {
          company?: string | null;
          created_at?: string | null;
          email: string;
          id?: string;
          is_read?: boolean | null;
          message: string;
          name: string;
          phone?: string | null;
        };
        Update: {
          company?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_type: string | null;
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          account_type?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          account_type?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_contacts: {
        Row: {
          business_id: string;
          business_name: string;
          business_slug: string | null;
          country_name: string | null;
          created_at: string;
          email: string | null;
          id: string;
          industry: string | null;
          logo_url: string | null;
          note: string | null;
          personal_profile_id: string | null;
          phone: string | null;
          province: string | null;
          updated_at: string;
          user_id: string;
          website: string | null;
        };
        Insert: {
          business_id: string;
          business_name: string;
          business_slug?: string | null;
          country_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          note?: string | null;
          personal_profile_id?: string | null;
          phone?: string | null;
          province?: string | null;
          updated_at?: string;
          user_id: string;
          website?: string | null;
        };
        Update: {
          business_id?: string;
          business_name?: string;
          business_slug?: string | null;
          country_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          note?: string | null;
          personal_profile_id?: string | null;
          phone?: string | null;
          province?: string | null;
          updated_at?: string;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "saved_contacts_personal_profile_id_fkey";
            columns: ["personal_profile_id"];
            isOneToOne: false;
            referencedRelation: "personal_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sepay_logs: {
        Row: {
          amount: number;
          content: string;
          id: number;
          processed_at: string | null;
          reference_code: string;
        };
        Insert: {
          amount: number;
          content: string;
          id?: number;
          processed_at?: string | null;
          reference_code: string;
        };
        Update: {
          amount?: number;
          content?: string;
          id?: number;
          processed_at?: string | null;
          reference_code?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          business_id: string | null;
          created_at: string;
          current_period_end: string | null;
          id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_subscription_id: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          sub_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          business_id?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          sub_type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          business_id?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          sub_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wallet_limits: {
        Row: {
          blocks_purchased: number;
          created_at: string;
          current_saved_count: number;
          id: string;
          max_saved_allowed: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          blocks_purchased?: number;
          created_at?: string;
          current_saved_count?: number;
          id?: string;
          max_saved_allowed?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          blocks_purchased?: number;
          created_at?: string;
          current_saved_count?: number;
          id?: string;
          max_saved_allowed?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_add_quota_bonus: {
        Args: { _business_id: string; _credits: number };
        Returns: undefined;
      };
      admin_add_wallet_block: { Args: { _user_id: string }; Returns: undefined };
      approve_business_claim: { Args: { claim_id: string }; Returns: boolean };
      connect_and_exchange: {
        Args: { _business_id: string; _source?: string };
        Returns: Json;
      };
      ensure_wallet_limits: {
        Args: { _user: string };
        Returns: {
          blocks_purchased: number;
          created_at: string;
          current_saved_count: number;
          id: string;
          max_saved_allowed: number;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "wallet_limits";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_business_quota: { Args: { _business_id: string }; Returns: Json };
      get_my_quota: { Args: never; Returns: Json };
      get_public_country_codes: {
        Args: never;
        Returns: { country_code: string | null }[];
      };
      get_public_stats: { Args: never; Returns: Json };
      get_randomized_explore_businesses: {
        Args: {
          p_country?: string;
          p_industry_slug?: string;
          p_search?: string;
        };
        Returns: {
          address: string | null;
          banner_url: string | null;
          certifications: Json;
          country_code: string | null;
          created_at: string;
          description: string | null;
          email: string | null;
          followers_count: number;
          icon_tier: Database["public"]["Enums"]["icon_tier"];
          id: string;
          industry_id: string | null;
          is_claimed: boolean;
          lat: number | null;
          lng: number | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          premium_until: string | null;
          province: string | null;
          qr_scans_count: number;
          shares_count: number;
          short_intro: string | null;
          slug: string;
          status: Database["public"]["Enums"]["business_status"];
          updated_at: string;
          views_count: number;
          website: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "businesses";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      increase_daily_views: { Args: never; Returns: undefined };
      increment_business_qr_scans: { Args: { _id: string }; Returns: undefined };
      increment_business_shares: { Args: { _id: string }; Returns: undefined };
      increment_business_views: { Args: { _id: string }; Returns: undefined };
      is_admin: { Args: never; Returns: boolean };
      my_wallet_limits: { Args: never; Returns: Json };
      process_sepay_payment: {
        Args: {
          p_amount: number;
          p_plan_id: string;
          p_raw_content: string;
          p_ref: string;
          p_short_biz_id: string;
          p_short_user_id: string;
        };
        Returns: Json;
      };
      reject_business_claim: { Args: { claim_id: string }; Returns: boolean };
      send_card_visit:
        | {
            Args: {
              _body?: string;
              _from_business?: string;
              _from_user?: string;
              _subject?: string;
              _to_business?: string;
              _to_user?: string;
            };
            Returns: string;
          }
        | {
            Args: {
              _body: string;
              _from_business: string;
              _subject: string;
              _to_business: string;
            };
            Returns: string;
          };
      submit_manual_payment: {
        Args: {
          p_amount: number;
          p_business_id?: string;
          p_plan_id: string;
          p_receipt_url: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_account_type: "personal" | "business";
      app_role: "admin" | "user";
      business_status: "draft" | "public";
      icon_tier: "standard" | "premium";
      payment_provider: "stripe" | "paypal" | "manual" | "sepay";
      payment_type: "membership" | "extra_quota" | "icon_premium" | "contact_block_addon";
      subscription_status: "active" | "canceled" | "past_due" | "incomplete";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_account_type: ["personal", "business"],
      app_role: ["admin", "user"],
      business_status: ["draft", "public"],
      icon_tier: ["standard", "premium"],
      payment_provider: ["stripe", "paypal", "manual", "sepay"],
      payment_type: ["membership", "extra_quota", "icon_premium", "contact_block_addon"],
      subscription_status: ["active", "canceled", "past_due", "incomplete"],
    },
  },
} as const;
