import { createClient } from '@/lib/supabase/client'
import { Asset, AssetPrice, Order, Trade, Holding, MarketAgent } from '@/types'

/**
 * Fetch All Active Assets in Bolsa Belmont with Dynamic 24h Change Calculation
 */
export async function getAssetsService(): Promise<Asset[]> {
  const supabase = createClient()
  try {
    const { data: assets, error } = await (supabase
      .from('assets') as any)
      .select('*')
      .eq('is_active', true)
      .order('symbol', { ascending: true })

    if (error || !assets) return []

    // Calculate dynamic 24h change % based on asset_prices history
    const enrichedAssets = await Promise.all(
      assets.map(async (asset: Asset) => {
        const { data: firstPriceLog } = await (supabase
          .from('asset_prices') as any)
          .select('price')
          .eq('asset_id', asset.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        if (firstPriceLog && firstPriceLog.price > 0) {
          const basePrice = firstPriceLog.price
          const changePct = Number((((asset.current_price - basePrice) / basePrice) * 100).toFixed(2))
          return { ...asset, change_24h: changePct }
        }
        return asset
      })
    )

    return enrichedAssets
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

    // Execute matching
    await (supabase as any).rpc('match_orders_for_asset', { p_asset_id: assetId })

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao emitir ordem na Bolsa.' }
  }
}

/**
 * Cancel Pending Order via RPC
 */
export async function cancelOrderService(orderId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { error } = await (supabase as any).rpc('cancel_order', { p_order_id: orderId })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao cancelar ordem.' }
  }
}
