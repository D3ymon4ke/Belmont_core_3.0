import { createClient } from '@/lib/supabase/client'
import { CoinTransaction, UserProgress, Achievement, UserAchievement } from '@/types'

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
 * Fetch Real Coin Transactions Ledger
 */
export async function getTransactionsService(): Promise<CoinTransaction[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await (supabase
      .from('coin_transactions') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as CoinTransaction[]
  } catch (e) {
    return []
  }
}

/**
 * Fetch Real User XP & Rank Progress
 */
export async function getUserProgressService(userId?: string): Promise<UserProgress> {
  const supabase = createClient()
  try {
    const targetId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetId) return { user_id: '', xp: 0, rank_title: 'Iniciado', updated_at: new Date().toISOString() }

    const { data, error } = await (supabase
      .from('user_progress') as any)
      .select('*')
      .eq('user_id', targetId)
      .single()

    if (error || !data) {
      return { user_id: targetId, xp: 0, rank_title: 'Iniciado', updated_at: new Date().toISOString() }
    }
    return data as UserProgress
  } catch (e) {
    return { user_id: userId || '', xp: 0, rank_title: 'Iniciado', updated_at: new Date().toISOString() }
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

    if (error || !data) return []
    return data as Achievement[]
  } catch (e) {
    return []
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

    if (error || !data) return []
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
    const { error } = await (supabase as any).rpc('add_coins_admin', {
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
