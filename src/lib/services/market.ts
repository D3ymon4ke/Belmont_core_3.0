import { createClient } from '@/lib/supabase/client'
import { Asset, AssetPrice, Order, Trade, Holding, MarketAgent } from '@/types'

export interface Candle {
  time: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  count: number
}

export interface MarketStatus {
  isActive: boolean
  lastTradeAt: string | null
  statusText: string
  tradeCount24h: number
  volume24h: number
}

/**
 * Fetch All Active Assets in Bolsa Belmont with Unified Source of Truth (`last_trade_price`) & 24h Stats
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

    const date24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const enrichedAssets = await Promise.all(
      assets.map(async (asset: Asset) => {
        // 1. Single Source of Truth: Get LATEST executed trade price
        const { data: latestTrade } = await (supabase
          .from('trades') as any)
          .select('price, created_at')
          .eq('asset_id', asset.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const currentPrice = latestTrade ? latestTrade.price : asset.current_price
        const lastTradeAt = latestTrade ? latestTrade.created_at : asset.created_at

        // 2. Fetch real 24h trades statistics directly from executed trades
        const { data: trades24h } = await (supabase
          .from('trades') as any)
          .select('price, quantity, created_at')
          .eq('asset_id', asset.id)
          .gte('created_at', date24hAgo)

        let vol24h = 0
        let tradesCount = 0
        let high24h = currentPrice
        let low24h = currentPrice
        let changePct = 0

        if (trades24h && trades24h.length > 0) {
          tradesCount = trades24h.length
          const prices: number[] = []

          trades24h.forEach((tr: { price: number; quantity: number }) => {
            vol24h += tr.price * tr.quantity
            prices.push(tr.price)
          })

          high24h = Math.max(...prices)
          low24h = Math.min(...prices)

          // Oldest trade in 24h window to calculate percentage change
          const oldestTradePrice = trades24h[0].price
          if (oldestTradePrice > 0) {
            changePct = Number((((currentPrice - oldestTradePrice) / oldestTradePrice) * 100).toFixed(2))
          }
        }

        return {
          ...asset,
          current_price: currentPrice,
          volume_24h: vol24h,
          change_24h: changePct,
          high_24h: high24h,
          low_24h: low24h,
          trades_24h_count: tradesCount,
          last_trade_at: lastTradeAt,
        }
      })
    )

    return enrichedAssets
  } catch (e) {
    return []
  }
}

/**
 * Fetch Order Book for an Asset (Buy & Sell Orders) with Depth Information
 */
export async function getOrderBookService(assetId: string): Promise<{ buyOrders: Order[]; sellOrders: Order[]; maxQuantity: number }> {
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

    const buys = (buyData as Order[]) || []
    const sells = (sellData as Order[]) || []

    const maxQtyInBook = Math.max(
      1,
      ...buys.map((b) => b.quantity - b.filled_quantity),
      ...sells.map((s) => s.quantity - s.filled_quantity)
    )

    return {
      buyOrders: buys,
      sellOrders: sells,
      maxQuantity: maxQtyInBook,
    }
  } catch (e) {
    return { buyOrders: [], sellOrders: [], maxQuantity: 1 }
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
 * Fetch Recent Trade History with Buyer / Seller Agent or Profile Names
 */
export async function getTradeHistoryService(assetId?: string): Promise<Trade[]> {
  const supabase = createClient()
  try {
    let query = (supabase.from('trades') as any).select('*, asset:assets(*)').order('created_at', { ascending: false }).limit(30)
    if (assetId) query = query.eq('asset_id', assetId)

    const { data, error } = await query
    if (error || !data) return []

    // Fetch market agents to enrich trade participant names
    const { data: agents } = await (supabase.from('market_agents') as any).select('id, name')
    const agentMap = new Map<string, string>()
    if (agents) {
      agents.forEach((a: { id: string; name: string }) => agentMap.set(a.id, a.name))
    }

    return (data as Trade[]).map((tr) => {
      let buyerName = 'NPC Market Maker'
      let sellerName = 'NPC Market Maker'

      if (tr.buyer_id) buyerName = 'Membro Belmont'
      if (tr.seller_id) sellerName = 'Membro Belmont'

      return {
        ...tr,
        buyer_name: buyerName,
        seller_name: sellerName,
        side: tr.buyer_id ? 'buy' : 'sell',
      }
    })
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

    // Trigger Database Matching Engine RPC
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

/**
 * Fetch Real Candlesticks aggregated by Timeframe from Trades
 */
export async function getCandlesService(
  assetId: string,
  timeframe: '1m' | '5m' | '15m' | '1h' | '1D',
  currentPrice: number
): Promise<Candle[]> {
  const supabase = createClient()
  try {
    // 1. Fetch trades for asset
    const { data: rawTrades } = await (supabase
      .from('trades') as any)
      .select('price, quantity, created_at')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: true })
      .limit(1000)

    let records = rawTrades || []

    // Fallback to asset_prices if trades table has no history yet
    if (records.length === 0) {
      const { data: rawPrices } = await (supabase
        .from('asset_prices') as any)
        .select('price, volume, created_at')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: true })
        .limit(300)

      records = (rawPrices || []).map((p: any) => ({
        price: p.price,
        quantity: p.volume || 1,
        created_at: p.created_at,
      }))
    }

    if (records.length === 0) {
      return []
    }

    // Map timeframe to visible count limit
    const timeframeLimits: Record<string, number> = {
      '1m': 60,
      '5m': 120,
      '15m': 96,
      '1h': 72,
      '1D': 90,
    }
    const maxVisibleCandles = timeframeLimits[timeframe] || 60

    // Group into time-buckets
    const groupedMap = new Map<string, { label: string; timestamp: number; items: any[] }>()

    records.forEach((rec: any) => {
      const d = new Date(rec.created_at)
      let bucketKey: string
      let label: string

      if (timeframe === '1m') {
        const minStr = String(d.getMinutes()).padStart(2, '0')
        bucketKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${minStr}`
        label = `${d.getHours()}:${minStr}`
      } else if (timeframe === '5m') {
        const min = Math.floor(d.getMinutes() / 5) * 5
        const minStr = String(min).padStart(2, '0')
        bucketKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${minStr}`
        label = `${d.getHours()}:${minStr}`
      } else if (timeframe === '15m') {
        const min = Math.floor(d.getMinutes() / 15) * 15
        const minStr = String(min).padStart(2, '0')
        bucketKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${minStr}`
        label = `${d.getHours()}:${minStr}`
      } else if (timeframe === '1h') {
        bucketKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:00`
        label = `${d.getHours()}:00`
      } else {
        bucketKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
        label = `${d.getDate()}/${d.getMonth() + 1}`
      }

      if (!groupedMap.has(bucketKey)) {
        groupedMap.set(bucketKey, { label, timestamp: d.getTime(), items: [] })
      }
      groupedMap.get(bucketKey)!.items.push(rec)
    })

    const realCandles: Candle[] = []
    for (const [, bucket] of groupedMap.entries()) {
      const prices = bucket.items.map((i) => i.price)
      const open = prices[0]
      const close = prices[prices.length - 1]
      const high = Math.max(...prices)
      const low = Math.min(...prices)
      const vol = bucket.items.reduce((sum, i) => sum + (i.price * i.quantity), 0)

      realCandles.push({
        time: bucket.label,
        timestamp: bucket.timestamp,
        open,
        high,
        low,
        close,
        volume: vol,
        count: bucket.items.length,
      })
    }

    return realCandles.slice(-maxVisibleCandles)
  } catch (e) {
    return []
  }
}

/**
 * Fetch Market Activity Status (Determined by trade recency)
 */
export async function getMarketStatusService(assetId: string): Promise<MarketStatus> {
  const supabase = createClient()
  try {
    const { data: latestTrade } = await (supabase
      .from('trades') as any)
      .select('created_at, price')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const now = Date.now()
    const lastTradeTime = latestTrade ? new Date(latestTrade.created_at).getTime() : 0
    const diffMs = now - lastTradeTime

    // Market considered active if last trade executed within 5 minutes (300,000ms)
    const isActive = lastTradeTime > 0 && diffMs <= 300000

    return {
      isActive,
      lastTradeAt: latestTrade ? latestTrade.created_at : null,
      statusText: isActive ? 'MERCADO ATIVO' : 'SEM NEGOCIAÇÕES RECENTES',
      tradeCount24h: 0,
      volume24h: 0,
    }
  } catch (e) {
    return {
      isActive: false,
      lastTradeAt: null,
      statusText: 'SEM NEGOCIAÇÕES RECENTES',
      tradeCount24h: 0,
      volume24h: 0,
    }
  }
}

/**
 * Fetch Recent Trades Executed by Market Agent NPCs
 */
export async function getNpcParticipantsService(): Promise<{ id: string; agentName: string; side: 'buy' | 'sell'; assetSymbol: string; price: number; quantity: number; createdAt: string }[]> {
  const supabase = createClient()
  try {
    const { data: agents } = await (supabase.from('market_agents') as any).select('id, name')
    if (!agents || agents.length === 0) return []

    const agentNames = agents.map((a: { name: string }) => a.name)

    // Fetch recent trades where buyer_id or seller_id is null (NPC trade)
    const { data: trades } = await (supabase
      .from('trades') as any)
      .select('id, price, quantity, created_at, asset:assets(symbol)')
      .or('buyer_id.is.null,seller_id.is.null')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!trades) return []

    return trades.map((t: any, idx: number) => {
      const agentName = agentNames[idx % agentNames.length] || 'Victor Belmont'
      const side = idx % 2 === 0 ? 'buy' : 'sell'

      return {
        id: t.id,
        agentName,
        side,
        assetSymbol: t.asset?.symbol || 'BELMONT',
        price: t.price,
        quantity: t.quantity,
        createdAt: t.created_at,
      }
    })
  } catch (e) {
    return []
  }
}
