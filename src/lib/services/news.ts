import { createClient } from '@/lib/supabase/client'
import { EconomicEvent, NewsArticle } from '@/types'

/**
 * Fetch Published News Articles (Optionally filtered by Asset)
 */
export async function getNewsArticlesService(assetId?: string): Promise<NewsArticle[]> {
  const supabase = createClient()
  try {
    let query = (supabase.from('news_articles') as any)
      .select('*, event:economic_events(*), related_asset:assets(*)')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    if (assetId) {
      query = query.eq('related_asset_id', assetId)
    }

    const { data, error } = await query
    if (error || !data) return []
    return data as NewsArticle[]
  } catch (e) {
    return []
  }
}

/**
 * Fetch Economic Events
 */
export async function getEconomicEventsService(onlyActive: boolean = true): Promise<EconomicEvent[]> {
  const supabase = createClient()
  try {
    let query = (supabase.from('economic_events') as any)
      .select('*, target_asset:assets(*)')
      .order('created_at', { ascending: false })

    if (onlyActive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error || !data) return []
    return data as EconomicEvent[]
  } catch (e) {
    return []
  }
}

/**
 * Admin: Create Economic Event
 */
export async function createEconomicEventAdminService(
  title: string,
  description: string,
  type: 'positive' | 'negative' | 'neutral' | 'rumor',
  targetAssetId: string | null,
  impactScore: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { error } = await (supabase.from('economic_events') as any).insert({
      title,
      description,
      type,
      target_asset_id: targetAssetId || null,
      impact_score: impactScore,
      is_active: true,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao criar evento econômico.' }
  }
}

/**
 * Admin: Create News Article
 */
export async function createNewsArticleAdminService(
  title: string,
  summary: string,
  content: string,
  eventId: string | null,
  relatedAssetId: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await (supabase.from('news_articles') as any).insert({
      title,
      summary,
      content,
      event_id: eventId || null,
      related_asset_id: relatedAssetId || null,
      author_id: user?.id || null,
      is_published: true,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao publicar notícia.' }
  }
}
