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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      creator_payouts: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          id: string
          market_id: string
          processed_at: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          creator_id: string
          id?: string
          market_id: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          id?: string
          market_id?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_payouts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_payouts_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "user_markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_participants: {
        Row: {
          avg_price: number
          created_at: string
          id: string
          market_id: string | null
          market_title: string | null
          position: string
          shares: number
          total_invested: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price?: number
          created_at?: string
          id?: string
          market_id?: string | null
          market_title?: string | null
          position: string
          shares?: number
          total_invested?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price?: number
          created_at?: string
          id?: string
          market_id?: string | null
          market_title?: string | null
          position?: string
          shares?: number
          total_invested?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_participants_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "user_markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_trades: {
        Row: {
          created_at: string
          id: string
          market_id: string | null
          market_title: string | null
          position: string
          price: number
          shares: number
          side: string
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_id?: string | null
          market_title?: string | null
          position: string
          price: number
          shares: number
          side: string
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          market_id?: string | null
          market_title?: string | null
          position?: string
          price?: number
          shares?: number
          side?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "user_markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_topics: {
        Row: {
          auto_created_market_id: string | null
          category: string
          created_at: string
          headline: string
          id: string
          is_processed: boolean
          source_name: string | null
          source_url: string
          suggested_end_date: string | null
          suggested_market_title: string | null
        }
        Insert: {
          auto_created_market_id?: string | null
          category?: string
          created_at?: string
          headline: string
          id?: string
          is_processed?: boolean
          source_name?: string | null
          source_url: string
          suggested_end_date?: string | null
          suggested_market_title?: string | null
        }
        Update: {
          auto_created_market_id?: string | null
          category?: string
          created_at?: string
          headline?: string
          id?: string
          is_processed?: boolean
          source_name?: string | null
          source_url?: string
          suggested_end_date?: string | null
          suggested_market_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_topics_auto_created_market_id_fkey"
            columns: ["auto_created_market_id"]
            isOneToOne: false
            referencedRelation: "user_markets"
            referencedColumns: ["id"]
          },
        ]
      }
      open_orders: {
        Row: {
          created_at: string
          expiration: string | null
          filled_shares: number
          id: string
          market_id: string | null
          market_title: string | null
          outcome: string
          price: number
          shares: number
          side: string
          status: string
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiration?: string | null
          filled_shares?: number
          id?: string
          market_id?: string | null
          market_title?: string | null
          outcome: string
          price: number
          shares: number
          side: string
          status?: string
          total_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiration?: string | null
          filled_shares?: number
          id?: string
          market_id?: string | null
          market_title?: string | null
          outcome?: string
          price?: number
          shares?: number
          side?: string
          status?: string
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "user_markets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          twitter_username: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          twitter_username?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          twitter_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_markets: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          description: string | null
          end_date: string
          id: string
          liquidity: number
          news_headline: string | null
          news_source_url: string | null
          no_price: number
          resolution: Database["public"]["Enums"]["market_resolution"]
          revenue_share_percent: number
          status: Database["public"]["Enums"]["market_status"]
          title: string
          twitter_embed_enabled: boolean
          twitter_post_id: string | null
          updated_at: string
          volume: number
          yes_price: number
        }
        Insert: {
          category?: string
          created_at?: string
          creator_id: string
          description?: string | null
          end_date: string
          id?: string
          liquidity?: number
          news_headline?: string | null
          news_source_url?: string | null
          no_price?: number
          resolution?: Database["public"]["Enums"]["market_resolution"]
          revenue_share_percent?: number
          status?: Database["public"]["Enums"]["market_status"]
          title: string
          twitter_embed_enabled?: boolean
          twitter_post_id?: string | null
          updated_at?: string
          volume?: number
          yes_price?: number
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          end_date?: string
          id?: string
          liquidity?: number
          news_headline?: string | null
          news_source_url?: string | null
          no_price?: number
          resolution?: Database["public"]["Enums"]["market_resolution"]
          revenue_share_percent?: number
          status?: Database["public"]["Enums"]["market_status"]
          title?: string
          twitter_embed_enabled?: boolean
          twitter_post_id?: string | null
          updated_at?: string
          volume?: number
          yes_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_markets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          user_id: string
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          user_id: string
          wallet_address: string
          wallet_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          user_id?: string
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_wallet_address: { Args: never; Returns: string }
    }
    Enums: {
      market_resolution: "yes" | "no" | "invalid" | "pending"
      market_status: "draft" | "active" | "paused" | "resolved" | "cancelled"
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
      market_resolution: ["yes", "no", "invalid", "pending"],
      market_status: ["draft", "active", "paused", "resolved", "cancelled"],
    },
  },
} as const
