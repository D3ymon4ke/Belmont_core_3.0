import { createClient } from '@/lib/supabase/client'
import { CoinTransaction, UserProgress, Achievement, UserAchievement } from '@/types'

// Mock Data Fallbacks for local offline development
export const MOCK_TRANSACTIONS: CoinTransaction[] = [
  {
    id: 'tx-1',
    user_id: 'user-1',
    amount: 100,
    type: 'reward',
    description: 'Bônus de boas-vindas Belmont Core 2.0',
    reference_id: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'tx-2',
    user_id: 'user-1',
    amount: 25,
    type: 'reward',
    description: 'Conquista desbloqueada: Primeiro Passo',
    reference_id: 'first_post',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'tx-3',
    user_id: 'user-1',
    amount: 500,
    type: 'admin',
    description: 'Recompensa por contribuição em arquitetura do sistema',
    reference_id: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_post',
    title: 'Primeiro Passo',
    description: 'Criou sua primeira publicação no Feed da Mansão.',
    icon: 'Compass',
    category: 'social',
    rarity: 'common',
    xp_reward: 50,
    coins_reward: 25,
    created_at: new Date().toISOString(),
  },
  {
    id: 'first_chat',
    title: 'Voz da Mansão',
    description: 'Enviou sua primeira mensagem no Chat Geral.',
    icon: 'MessageSquare',
    category: 'community',
    rarity: 'common',
    xp_reward: 50,
    coins_reward: 25,
    created_at: new Date().toISOString(),
  },
  {
    id: 'first_dm',
    title: 'Primeiro Contato',
    description: 'Enviou uma mensagem privada para outro membro.',
    icon: 'Send',
    category: 'social',
    rarity: 'common',
    xp_reward: 50,
    coins_reward: 25,
    created_at: new Date().toISOString(),
  },
  {
    id: 'chroncler',
    title: 'Cronista',
    description: 'Criou 10 publicações no Feed da Mansão.',
    icon: 'Feather',
    category: 'community',
    rarity: 'rare',
    xp_reward: 200,
    coins_reward: 100,
    created_at: new Date().toISOString(),
  },
  {
    id: 'founder',
    title: 'Fundador da Mansão',
    description: 'Membro fundador presente na inauguração do Belmont Core 2.0.',
    icon: 'Shield',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 500,
    coins_reward: 250,
    created_at: new Date().toISOString(),
  },
]

export const MOCK_USER_PROGRESS: UserProgress = {
  user_id: 'user-1',
  xp: 1840,
  rank_title: 'Guardião',
  updated_at: new Date().toISOString(),
}

// XP Threshold Calculator Helper
export function getRankProgress(xp: number) {
  const ranks = [
    { title: 'Iniciado', minXP: 0, maxXP: 100 },
    { title: 'Habitante', minXP: 100, maxXP: 500 },
    { title: 'Membro', minXP: 500, maxXP: 1000 },
    { title: 'Veterano', minXP: 1000, maxXP: 2500 },
    { title: 'Guardião', minXP: 2500, maxXP: 5000 },
    { title: 'Conselheiro', minXP: 5000, maxXP: 10000 },
    { title: 'Mestre da Mansão', minXP: 10000, maxXP: 10000 },
  ]

  const currentRank = [...ranks].reverse().find((r) => xp >= r.minXP) || ranks[0]
  const isMaxRank = currentRank.title === 'Mestre da Mansão'
  const nextRank = isMaxRank ? currentRank : ranks[ranks.indexOf(currentRank) + 1]

  const xpInCurrentRank = xp - currentRank.minXP
  const rankXpNeeded = nextRank.maxXP - currentRank.minXP
  const percent = isMaxRank ? 100 : Math.min(100, Math.round((xpInCurrentRank / rankXpNeeded) * 100))
  const remainingXP = isMaxRank ? 0 : nextRank.maxXP - xp

  return {
    currentRankTitle: currentRank.title,
    nextRankTitle: nextRank.title,
    currentXP: xp,
    minXP: currentRank.minXP,
    maxXP: nextRank.maxXP,
    percent,
    remainingXP,
    isMaxRank,
  }
}

/**
 * Fetch Coin Transactions Ledger
 */
export async function getTransactionsService(): Promise<CoinTransaction[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return MOCK_TRANSACTIONS

    const { data, error } = await (supabase
      .from('coin_transactions') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) return MOCK_TRANSACTIONS
    return data as CoinTransaction[]
  } catch (e) {
    return MOCK_TRANSACTIONS
  }
}

/**
 * Fetch User XP & Rank Progress
 */
export async function getUserProgressService(userId?: string): Promise<UserProgress> {
  const supabase = createClient()
  try {
    const targetId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetId) return MOCK_USER_PROGRESS

    const { data, error } = await (supabase
      .from('user_progress') as any)
      .select('*')
      .eq('user_id', targetId)
      .single()

    if (error || !data) return MOCK_USER_PROGRESS
    return data as UserProgress
  } catch (e) {
    return MOCK_USER_PROGRESS
  }
}

/**
 * Fetch All Achievements Catalogue
 */
export async function getAchievementsService(): Promise<Achievement[]> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('achievements') as any)
      .select('*')
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) return MOCK_ACHIEVEMENTS
    return data as Achievement[]
  } catch (e) {
    return MOCK_ACHIEVEMENTS
  }
}

/**
 * Fetch User Unlocked Achievements
 */
export async function getUserAchievementsService(userId?: string): Promise<UserAchievement[]> {
  const supabase = createClient()
  try {
    const targetId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetId) return []

    const { data, error } = await (supabase
      .from('user_achievements') as any)
      .select('*, achievement:achievements(*)')
      .eq('user_id', targetId)

    if (error || !data || data.length === 0) {
      return MOCK_ACHIEVEMENTS.slice(0, 3).map(ach => ({
        id: `ua-${ach.id}`,
        user_id: targetId,
        achievement_id: ach.id,
        unlocked_at: new Date().toISOString(),
        achievement: ach,
      }))
    }
    return data as UserAchievement[]
  } catch (e) {
    return []
  }
}

/**
 * Admin Coin Adjustment RPC call
 */
export async function adminAdjustCoinsService(
  targetUserId: string,
  amount: number,
  description: string
): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase as any).rpc('add_coins_admin', {
      p_user_id: targetUserId,
      p_amount: amount,
      p_description: description,
    })

    if (error) throw error
    return true
  } catch (e) {
    console.error('Admin coin adjustment error:', e)
    return false
  }
}

/**
 * Unlock Achievement RPC call
 */
export async function unlockAchievementService(
  userId: string,
  achievementId: string
): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await (supabase as any).rpc('unlock_achievement', {
      p_user_id: userId,
      p_achievement_id: achievementId,
    })
    if (error) throw error
    return true
  } catch (e) {
    return false
  }
}
