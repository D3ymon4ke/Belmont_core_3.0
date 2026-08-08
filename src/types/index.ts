import { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type CoinTransaction = Database['public']['Tables']['coin_transactions']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'] & {
  achievement?: Achievement
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
