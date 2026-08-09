import { createClient } from '@/lib/supabase/client'
import { Asset, Order, Holding, Trade } from '@/types'

export interface CandleOHLCV {
  time: number // Unix timestamp in seconds
  timeStr: string // Formatted display time
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketStatus {
  isActive: boolean
  lastTradeAt: string | null
  statusText: string
}

/**
 * Fetch All Active Assets with Unified Source of Truth (`currentMarketPrice`) & 24h Stats
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
        // 1. Single Source of Truth: LATEST executed trade price
        const { data: latestTrade } = await (supabase
          .from('trades') as any)
          .select('price, created_at')
          .eq('asset_id', asset.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const currentPrice = latestTrade ? parseFloat(latestTrade.price) : parseFloat(asset.current_price || '100')
        const lastTradeAt = latestTrade ? latestTrade.created_at : asset.created_at

        // 2. Fetch real 24h trades statistics
        const { data: trades24h } = await (supabase
          .from('trades') as any)
          .select('price, quantity, created_at')
          .eq('asset_id', asset.id)
          .gte('created_at', date24hAgo)
          .order('created_at', { ascending: true })

        let vol24h = 0
        let tradesCount = 0
        let high24h = currentPrice
        let low24h = currentPrice
        let changePct = 0

        if (trades24h && trades24h.length > 0) {
          tradesCount = trades24h.length
          const prices: number[] = []

          trades24h.forEach((tr: { price: any; quantity: number }) => {
            const p = parseFloat(tr.price)
            vol24h += p * tr.quantity
            prices.push(p)
          })

          high24h = Math.max(...prices)
          low24h = Math.min(...prices)

          // Compare against oldest trade in 24h window
          const oldestTradePrice = parseFloat(trades24h[0].price)
          if (oldestTradePrice > 0) {
            changePct = Number((((currentPrice - oldestTradePrice) / oldestTradePrice) * 100).toFixed(2))
          }
        }

        return {
          ...asset,
          current_price: currentPrice,
          volume_24h: Number(vol24h.toFixed(2)),
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
      buyOrders: buys.map(b => ({ ...b, price: parseFloat(b.price as any) })),
      sellOrders: sells.map(s => ({ ...s, price: parseFloat(s.price as any) })),
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
    return (data as Holding[]).map(h => ({
      ...h,
      average_price: parseFloat(h.average_price as any),
      asset: h.asset ? { ...h.asset, current_price: parseFloat(h.asset.current_price as any) } : undefined
    }))
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
    return (data as Order[]).map(o => ({
      ...o,
      price: parseFloat(o.price as any),
    }))
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
    let query = (supabase.from('trades') as any).select('*, asset:assets(*)').order('created_at', { ascending: false }).limit(25)
    if (assetId) query = query.eq('asset_id', assetId)

    const { data, error } = await query
    if (error || !data) return []

    return (data as Trade[]).map((tr) => ({
      ...tr,
      price: parseFloat(tr.price as any),
      side: tr.buyer_id ? 'buy' : 'sell',
    }))
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

    // Execute matching engine
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
 * Fetch Real Candlesticks aggregated strictly from Executed Trades for Lightweight Charts
 */
export async function getCandlesService(
  assetId: string,
  timeframe: '1m' | '5m' | '15m' | '1h' | '1D'
): Promise<CandleOHLCV[]> {
  const supabase = createClient()
  try {
    // Fetch trades ordered ascending by creation date
    const { data: rawTrades } = await (supabase
      .from('trades') as any)
      .select('price, quantity, created_at')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: true })
      .limit(2000)

    let records = rawTrades || []

    // Fallback to asset_prices if no trades exist yet
    if (records.length === 0) {
      const { data: rawPrices } = await (supabase
        .from('asset_prices') as any)
        .select('price, volume, created_at')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: true })
        .limit(500)

      records = (rawPrices || []).map((p: any) => ({
        price: p.price,
        quantity: p.volume || 1,
        created_at: p.created_at,
      }))
    }

    if (records.length === 0) return []

    // Timeframe bucket sizes in seconds
    const intervalSecondsMap: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '1D': 86400,
    }
    const intervalSec = intervalSecondsMap[timeframe] || 60

    // Target visible candles limit per timeframe
    const limitMap: Record<string, number> = {
      '1m': 60,
      '5m': 72,
      '15m': 96,
      '1h': 72,
      '1D': 90,
    }
    const maxCount = limitMap[timeframe] || 60

    const groupedMap = new Map<number, { unixSec: number; items: any[] }>()

    records.forEach((rec: any) => {
      const ms = new Date(rec.created_at).getTime()
      const unixSec = Math.floor(ms / 1000)
      const bucketSec = Math.floor(unixSec / intervalSec) * intervalSec

      if (!groupedMap.has(bucketSec)) {
        groupedMap.set(bucketSec, { unixSec: bucketSec, items: [] })
      }
      groupedMap.get(bucketSec)!.items.push(rec)
    })

    const candles: CandleOHLCV[] = []
    for (const [sec, bucket] of groupedMap.entries()) {
      const prices = bucket.items.map((i) => parseFloat(i.price))
      const open = prices[0]
      const close = prices[prices.length - 1]
      const high = Math.max(...prices)
      const low = Math.min(...prices)
      const volume = bucket.items.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0)

      const d = new Date(sec * 1000)
      const timeStr = timeframe === '1D'
        ? `${d.getDate()}/${d.getMonth() + 1}`
        : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

      candles.push({
        time: sec,
        timeStr,
        open,
        high,
        low,
        close,
        volume: Number(volume.toFixed(2)),
      })
    }

    return candles.slice(-maxCount)
  } catch (e) {
    return []
  }
}

/**
 * Fetch Market Activity Status
 */
export async function getMarketStatusService(assetId: string): Promise<MarketStatus> {
  const supabase = createClient()
  try {
    const { data: latestTrade } = await (supabase
      .from('trades') as any)
      .select('created_at')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const now = Date.now()
    const lastTradeTime = latestTrade ? new Date(latestTrade.created_at).getTime() : 0
    const diffMs = now - lastTradeTime
    const isActive = lastTradeTime > 0 && diffMs <= 300000

    return {
      isActive,
      lastTradeAt: latestTrade ? latestTrade.created_at : null,
      statusText: isActive ? 'MERCADO ATIVO' : 'SEM NEGOCIAÇÕES RECENTES',
    }
  } catch (e) {
    return {
      isActive: false,
      lastTradeAt: null,
      statusText: 'SEM NEGOCIAÇÕES RECENTES',
    }
  }
}
