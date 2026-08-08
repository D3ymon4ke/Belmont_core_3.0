import { createClient } from '@/lib/supabase/client'
import { Profile, Post, PostComment, Message, Conversation, Notification, Announcement, WelcomeContent } from '@/types'
import { unlockAchievementService } from './economy'

// ===================================================
// SUPABASE REAL DATABASE SERVICES (ZERO FAKE MOCKS)
// ===================================================

/**
 * Fetch Real Feed Posts from Supabase
 */
export async function getPostsService(): Promise<Post[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await (supabase
      .from('posts') as any)
      .select('*, author:profiles(*), post_likes(user_id)')
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((item: any) => ({
      ...item,
      user_has_liked: user ? item.post_likes?.some((l: any) => l.user_id === user.id) : false,
    })) as Post[]
  } catch (e) {
    return []
  }
}

/**
 * Create a Real Post in Supabase
 */
export async function createPostService(content: string, imageUrl?: string): Promise<Post | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data, error } = await (supabase
      .from('posts') as any)
      .insert({
        author_id: user.id,
        content,
        image_url: imageUrl || null,
      })
      .select('*, author:profiles(*)')
      .single()

    if (error) throw error

    // Auto Trigger Achievement 'first_post'
    await unlockAchievementService(user.id, 'first_post')

    return data as Post
  } catch (e) {
    console.error('Error creating post:', e)
    return null
  }
}

/**
 * Toggle Like on a Post in Supabase
 */
export async function toggleLikePostService(postId: string, currentLiked: boolean): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return !currentLiked

  try {
    if (currentLiked) {
      await (supabase.from('post_likes') as any)
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
    } else {
      await (supabase.from('post_likes') as any)
        .insert({ post_id: postId, user_id: user.id })
    }
    return !currentLiked
  } catch (e) {
    return !currentLiked
  }
}

/**
 * Get Real Post Comments
 */
export async function getPostCommentsService(postId: string): Promise<PostComment[]> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('post_comments') as any)
      .select('*, author:profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error || !data) return []
    return data as PostComment[]
  } catch (e) {
    return []
  }
}

/**
 * Add Comment to a Post
 */
export async function addPostCommentService(postId: string, content: string): Promise<PostComment | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data, error } = await (supabase
      .from('post_comments') as any)
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
      })
      .select('*, author:profiles(*)')
      .single()

    if (error) throw error
    return data as PostComment
  } catch (e) {
    console.error('Error adding comment:', e)
    return null
  }
}

/**
 * Get Real General Chat Messages
 */
export async function getGeneralChatMessagesService(): Promise<Message[]> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('messages') as any)
      .select('*, sender:profiles(*)')
      .eq('conversation_id', '00000000-0000-0000-0000-000000000001')
      .order('created_at', { ascending: true })

    if (error || !data) {
      return []
    }
    return data as Message[]
  } catch (e) {
    return []
  }
}

/**
 * Send Real General Chat Message
 */
export async function sendGeneralChatMessageService(content: string): Promise<Message | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data, error } = await (supabase
      .from('messages') as any)
      .insert({
        conversation_id: '00000000-0000-0000-0000-000000000001',
        sender_id: user.id,
        content,
      })
      .select('*, sender:profiles(*)')
      .single()

    if (error) throw error

    // Auto Trigger Achievement 'first_chat'
    await unlockAchievementService(user.id, 'first_chat')

    return data as Message
  } catch (e) {
    console.error('Error sending message:', e)
    return null
  }
}

/**
 * Search Real Profiles
 */
export async function searchProfilesService(query: string): Promise<Profile[]> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('*')
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10)

    if (error || !data) {
      return []
    }
    return data as Profile[]
  } catch (e) {
    return []
  }
}

/**
 * Get All Registered Mansion Profiles
 */
export async function getAllProfilesService(): Promise<Profile[]> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as Profile[]
  } catch (e) {
    return []
  }
}

/**
 * Get Profile by Username
 */
export async function getProfileByUsernameService(username: string): Promise<Profile | null> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('*')
      .eq('username', username)
      .single()

    if (error || !data) {
      return null
    }
    return data as Profile
  } catch (e) {
    return null
  }
}

/**
 * Get Latest Mansion Announcements
 */
export async function getAnnouncementsService(): Promise<Announcement[]> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('announcements') as any)
      .select('*, author:profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as Announcement[]
  } catch (e) {
    return []
  }
}

/**
 * Update Profile (Only if auth.uid matches id)
 */
export async function updateProfileService(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('profiles') as any)
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single()

    if (error) throw error
    return data as Profile
  } catch (e) {
    return null
  }
}
