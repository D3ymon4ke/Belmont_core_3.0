import { createClient } from '@/lib/supabase/client'
import { Asset, AssetPrice, Order, Trade, Holding, MarketAgent } from '@/types'

/**
 * Fetch All Active Assets in Bolsa Belmont
 */
export async function getAssetsService(): Promise<Asset[]> {
  const supabase = createClient()
  try {
    const { data, error } = await (supabase
      .from('assets') as any)
      .select('*')
      .eq('is_active', true)
      .order('symbol', { ascending: true })

    if (error || !data) return []
    return data as Asset[]
  } catch (e) {
    return []
  }
}

/**
 * Fetch Order Book for an Asset (Buy & Sell Orders)
 */
export async function getOrderBookService(assetId: string): Promise<{ buyOrders: Order[]; sellOrders: Order[] }> {
  const supabase = createClient()
  try {
    const { data: buyData } = await (supabase
      .from('orders') as any)
      .select('*, user:profiles(display_name, username)')
      .eq('asset_id', assetId)
      .eq('side', 'buy')
      .eq('status', 'pending')
      .order('price', { ascending: false })
      .limit(10)

    const { data: sellData } = await (supabase
      .from('orders') as any)
      .select('*, user:profiles(display_name, username)')
      .eq('asset_id', assetId)
      .eq('side', 'sell')
      .eq('status', 'pending')
      .order('price', { ascending: true })
      .limit(10)

    return {
      buyOrders: (buyData as Order[]) || [],
      sellOrders: (sellData as Order[]) || [],
    }
  } catch (e) {
    return { buyOrders: [], sellOrders: [] }
  }
}

/**
 * Fetch User Holdings (Portfolio Assets)
 */
export async function getUserHoldingsService(userId?: string): Promise<Holding[]> {
  const supabase = createClient()
  try {
    const targetId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetId) return []

    const { data, error } = await (supabase
      .from('holdings') as any)
      .select('*, asset:assets(*)')
      .eq('user_id', targetId)
      .gt('quantity', 0)

    if (error || !data) return []
    return data as Holding[]
  } catch (e) {
    return []
  }
}

/**
 * Fetch User Orders (Pending & History)
 */
export async function getUserOrdersService(userId?: string): Promise<Order[]> {
  const supabase = createClient()
  try {
    const targetId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetId) return []

    const { data, error } = await (supabase
      .from('orders') as any)
      .select('*, asset:assets(*)')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as Order[]
  } catch (e) {
    return []
  }
}

/**
 * Fetch Recent Trade History
 */
export async function getTradeHistoryService(assetId?: string): Promise<Trade[]> {
  const supabase = createClient()
  try {
    let query = (supabase.from('trades') as any).select('*, asset:assets(*)').order('created_at', { ascending: false }).limit(20)
    if (assetId) query = query.eq('asset_id', assetId)

    const { data, error } = await query
    if (error || !data) return []
    return data as Trade[]
  } catch (e) {
    return []
  }
}

/**
 * Create Order in Bolsa Belmont
 */
export async function createOrderService(
  assetId: string,
  side: 'buy' | 'sell',
  orderType: 'market' | 'limit',
  price: number,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Sessão não autenticada.' }

    if (quantity <= 0 || price <= 0) {
      return { success: false, error: 'Preço e quantidade devem ser maiores que zero.' }
    }

    // Check user balance or asset holdings
    if (side === 'buy') {
      const totalCost = price * quantity
      const { data: profile } = await (supabase.from('profiles') as any).select('belmont_coins').eq('id', user.id).single()
      if (!profile || profile.belmont_coins < totalCost) {
        return { success: false, error: 'Saldo em Belmont Coins insuficiente para abrir a ordem de compra.' }
      }
    } else {
      const { data: holding } = await (supabase.from('holdings') as any).select('quantity').eq('user_id', user.id).eq('asset_id', assetId).single()
      if (!holding || holding.quantity < quantity) {
        return { success: false, error: 'Quantidade insuficiente de ativos na carteira para venda.' }
      }
    }

    // Insert Order
    const { data: order, error } = await (supabase
      .from('orders') as any)
      .insert({
        user_id: user.id,
        asset_id: assetId,
        side,
        order_type: orderType,
        price,
        quantity,
        filled_quantity: 0,
        status: 'pending',
      })
      .select('*')
      .single()

    if (error) return { success: false, error: error.message }

    // Execute matching & NPC simulation
    await simulateMarketAgentsService(assetId)

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao emitir ordem na Bolsa.' }
  }
}

/**
 * NPC Market Liquidity & Simulation Engine
 */
export async function simulateMarketAgentsService(assetId: string): Promise<void> {
  const supabase = createClient()
  try {
    const { data: asset } = await (supabase.from('assets') as any).select('*').eq('id', assetId).single()
    if (!asset) return

    const { data: agents } = await (supabase.from('market_agents') as any).select('*').eq('is_active', true)
    if (!agents || agents.length === 0) return

    // Pick random NPC agent to provide market depth
    const agent = agents[Math.floor(Math.random() * agents.length)]
    const currentPrice = asset.current_price

    // Spread generation around current price
    const buyPrice = Math.max(1, currentPrice - Math.floor(Math.random() * 3))
    const sellPrice = currentPrice + Math.floor(Math.random() * 3) + 1
    const qty = Math.floor(Math.random() * 10) + 1

    // Post NPC orders
    await (supabase.from('orders') as any).insert([
      { agent_id: agent.id, asset_id: assetId, side: 'buy', order_type: 'limit', price: buyPrice, quantity: qty, status: 'pending' },
      { agent_id: agent.id, asset_id: assetId, side: 'sell', order_type: 'limit', price: sellPrice, quantity: qty, status: 'pending' },
    ])
  } catch (e) {
    // Ignore NPC simulation errors silently
  }
}
