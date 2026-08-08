import { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type CoinTransaction = Database['public']['Tables']['coin_transactions']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'] & {
  achievement?: Achievement
}

export type BankAccount = Database['public']['Tables']['bank_accounts']['Row']
export type BankTransaction = Database['public']['Tables']['bank_transactions']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type AssetPrice = Database['public']['Tables']['asset_prices']['Row']
export type MarketAgent = Database['public']['Tables']['market_agents']['Row']
export type Order = Database['public']['Tables']['orders']['Row'] & {
  asset?: Asset
  user?: Profile
}
export type Trade = Database['public']['Tables']['trades']['Row'] & {
  asset?: Asset
}
export type Holding = Database['public']['Tables']['holdings']['Row'] & {
  asset?: Asset
}

export type EconomicEvent = Database['public']['Tables']['economic_events']['Row'] & {
  target_asset?: Asset
}
export type NewsArticle = Database['public']['Tables']['news_articles']['Row'] & {
  event?: EconomicEvent
  related_asset?: Asset
  author?: Profile
}

export type Post = Database['public']['Tables']['posts']['Row'] & {
  author?: Profile
  likes?: Database['public']['Tables']['post_likes']['Row'][]
  user_has_liked?: boolean
}
export type PostComment = Database['public']['Tables']['post_comments']['Row'] & {
  author?: Profile
}
export type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  other_user?: Profile
  last_message?: Message
  unread_count?: number
}
export type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: Profile
}
export type Notification = Database['public']['Tables']['notifications']['Row'] & {
  actor?: Profile
}
export type Announcement = Database['public']['Tables']['announcements']['Row'] & {
  author?: Profile
}
export type WelcomeContent = Database['public']['Tables']['welcome_content']['Row']
