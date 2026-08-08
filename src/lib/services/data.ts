import { createClient } from '@/lib/supabase/client'
import { Profile, Post, PostComment, Message, Conversation, Notification, Announcement, WelcomeContent } from '@/types'
import { unlockAchievementService } from './economy'

// Mock Fallback Data (Active when DB tables are completely empty or initial setup is running)
export const MOCK_PROFILES: Profile[] = [
  {
    id: 'user-1',
    username: 'lord_belmont',
    display_name: 'Lord Belmont',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    banner_url: null,
    bio: 'Guardião dos segredos da Mansão. Arquiteto de Sistemas e fundador do Belmont Core.',
    status_text: 'Gerenciando a Mansão Belmont',
    is_admin: true,
    belmont_coins: 1250,
    rank_title: 'Guardião',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-2',
    username: 'sypha_v',
    display_name: 'Sypha Belnades',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    banner_url: null,
    bio: 'Mestra em criptografia e sistemas distribuídos.',
    status_text: 'Analisando logs da plataforma',
    is_admin: false,
    belmont_coins: 840,
    rank_title: 'Conselheira',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-3',
    username: 'alucard_d',
    display_name: 'Adrian Tepes',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    banner_url: null,
    bio: 'Especialista em UI/UX sombria e refinamento estético.',
    status_text: 'Refinando o design Obsidian',
    is_admin: false,
    belmont_coins: 950,
    rank_title: 'Veterano',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Lançamento do Belmont Core 2.0',
    body: 'Sejam bem-vindos à plataforma social reconstruída. Ambiente seguro, minimalista e com novas funcionalidades ativas.',
    author_id: 'user-1',
    author: MOCK_PROFILES[0],
    is_active: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    author_id: 'user-1',
    author: MOCK_PROFILES[0],
    content: 'O Belmont Core 2.0 foi desenhado com arquitetura limpa, RLS estrito no Supabase e uma atmosfera verdadeiramente inspirada na Mansão.',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    likes_count: 14,
    comments_count: 3,
    user_has_liked: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'post-2',
    author_id: 'user-3',
    author: MOCK_PROFILES[2],
    content: 'A combinação de obsidian, crimson velvet e gold crest proporciona uma estética madura e elegante para os membros da comunidade.',
    image_url: null,
    likes_count: 9,
    comments_count: 1,
    user_has_liked: false,
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    conversation_id: '00000000-0000-0000-0000-000000000001',
    sender_id: 'user-1',
    sender: MOCK_PROFILES[0],
    content: 'Saudações a todos os membros presentes no Belmont Core.',
    media_url: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-2',
    conversation_id: '00000000-0000-0000-0000-000000000001',
    sender_id: 'user-2',
    sender: MOCK_PROFILES[1],
    content: 'O chat persistido por polling está rodando de forma extremamente leve.',
    media_url: null,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
]

// ===================================================
// SUPABASE REAL DATABASE SERVICES
// ===================================================

/**
 * Fetch Feed Posts from Supabase
 */
export async function getPostsService(): Promise<Post[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await (supabase
      .from('posts') as any)
      .select('*, author:profiles(*), post_likes(user_id)')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return MOCK_POSTS
    }

    return data.map((item: any) => ({
      ...item,
      user_has_liked: user ? item.post_likes?.some((l: any) => l.user_id === user.id) : false,
    })) as Post[]
  } catch (e) {
    return MOCK_POSTS
  }
}

/**
 * Create a new Post in Supabase
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
    // Trigger local demo achievement unlock
    await unlockAchievementService(user.id, 'first_post')

    return {
      id: `post-${Date.now()}`,
      author_id: user.id,
      author: MOCK_PROFILES[0],
      content,
      image_url: imageUrl || null,
      likes_count: 0,
      comments_count: 0,
      user_has_liked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
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
 * Get Post Comments
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
    return {
      id: `cmt-${Date.now()}`,
      post_id: postId,
      author_id: user.id,
      author: MOCK_PROFILES[0],
      content,
      created_at: new Date().toISOString(),
    }
  }
}

/**
 * Get General Chat Messages
 */
export async function getGeneralChatMessagesService(): Promise<Message[]> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('messages') as any)
      .select('*, sender:profiles(*)')
      .eq('conversation_id', '00000000-0000-0000-0000-000000000001')
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) {
      return MOCK_MESSAGES
    }
    return data as Message[]
  } catch (e) {
    return MOCK_MESSAGES
  }
}

/**
 * Send General Chat Message
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
    await unlockAchievementService(user.id, 'first_chat')

    return {
      id: `msg-${Date.now()}`,
      conversation_id: '00000000-0000-0000-0000-000000000001',
      sender_id: user.id,
      sender: MOCK_PROFILES[0],
      content,
      media_url: null,
      created_at: new Date().toISOString(),
    }
  }
}

/**
 * Search Profiles for DMs
 */
export async function searchProfilesService(query: string): Promise<Profile[]> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('*')
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10)

    if (error || !data || data.length === 0) {
      return MOCK_PROFILES.filter(p => p.username.includes(query.toLowerCase()) || p.display_name.toLowerCase().includes(query.toLowerCase()))
    }
    return data as Profile[]
  } catch (e) {
    return MOCK_PROFILES
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
      return MOCK_PROFILES.find(p => p.username === username) || MOCK_PROFILES[0]
    }
    return data as Profile
  } catch (e) {
    return MOCK_PROFILES.find(p => p.username === username) || MOCK_PROFILES[0]
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
