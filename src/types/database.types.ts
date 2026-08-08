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
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          status_text: string | null
          is_admin: boolean
          belmont_coins: number
          rank_title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          status_text?: string | null
          is_admin?: boolean
          belmont_coins?: number
          rank_title?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          status_text?: string | null
          is_admin?: boolean
          belmont_coins?: number
          rank_title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          user_id: string
          balance: number
          accrued_yield: number
          yield_rate: number
          last_yield_calculated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          balance?: number
          accrued_yield?: number
          yield_rate?: number
          last_yield_calculated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          balance?: number
          accrued_yield?: number
          yield_rate?: number
          last_yield_calculated_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          amount: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          amount?: number
          description?: string
          created_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          id: string
          symbol: string
          name: string
          description: string
          current_price: number
          change_24h: number
          volume_24h: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          symbol: string
          name: string
          description: string
          current_price?: number
          change_24h?: number
          volume_24h?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          name?: string
          description?: string
          current_price?: number
          change_24h?: number
          volume_24h?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      asset_prices: {
        Row: {
          id: string
          asset_id: string
          price: number
          volume: number
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          price: number
          volume?: number
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          price?: number
          volume?: number
          created_at?: string
        }
        Relationships: []
      }
      market_agents: {
        Row: {
          id: string
          name: string
          personality: string
          cash_balance: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          personality: string
          cash_balance?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          personality?: string
          cash_balance?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          agent_id: string | null
          asset_id: string
          side: string
          order_type: string
          price: number
          quantity: number
          filled_quantity: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          agent_id?: string | null
          asset_id: string
          side: string
          order_type: string
          price: number
          quantity: number
          filled_quantity?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          agent_id?: string | null
          asset_id?: string
          side?: string
          order_type?: string
          price?: number
          quantity?: number
          filled_quantity?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          id: string
          asset_id: string
          buy_order_id: string
          sell_order_id: string
          buyer_id: string | null
          seller_id: string | null
          price: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          buy_order_id: string
          sell_order_id: string
          buyer_id?: string | null
          seller_id?: string | null
          price: number
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          buy_order_id?: string
          sell_order_id?: string
          buyer_id?: string | null
          seller_id?: string | null
          price?: number
          quantity?: number
          created_at?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          id: string
          user_id: string
          asset_id: string
          quantity: number
          average_price: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          asset_id: string
          quantity?: number
          average_price?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          asset_id?: string
          quantity?: number
          average_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          description: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          description: string
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: string
          description?: string
          reference_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          user_id: string
          xp: number
          rank_title: string
          updated_at: string
        }
        Insert: {
          user_id: string
          xp?: number
          rank_title?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          xp?: number
          rank_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string
          icon: string
          category: string
          rarity: string
          xp_reward: number
          coins_reward: number
          created_at: string
        }
        Insert: {
          id: string
          title: string
          description: string
          icon: string
          category: string
          rarity: string
          xp_reward?: number
          coins_reward?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon?: string
          category?: string
          rarity?: string
          xp_reward?: number
          coins_reward?: number
          created_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
        }
        Relationships: []
      }
      welcome_content: {
        Row: {
          id: string
          title: string
          content: string
          rules: string[]
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          rules?: string[]
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          rules?: string[]
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          author_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          author_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          author_id?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          image_url: string | null
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          image_url?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          image_url?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          title: string | null
          is_group: boolean
          is_general_chat: boolean
          created_at: string
          updated_at: string
          last_message_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          is_group?: boolean
          is_general_chat?: boolean
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          is_group?: boolean
          is_general_chat?: boolean
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
          last_read_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
          last_read_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
          last_read_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          media_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          media_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          media_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string | null
          type: string
          entity_type: string | null
          entity_id: string | null
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id?: string | null
          type: string
          entity_type?: string | null
          entity_id?: string | null
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string | null
          type?: string
          entity_type?: string | null
          entity_id?: string | null
          content?: string
          is_read?: boolean
          created_at?: string
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
