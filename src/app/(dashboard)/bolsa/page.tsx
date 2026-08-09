'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Activity,
  Layers,
  Info,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CandleChart } from '@/components/market/CandleChart'
import {
  getAssetsService,
  getOrderBookService,
  getUserHoldingsService,
  getUserOrdersService,
  getTradeHistoryService,
  createOrderService,
  cancelOrderService,
  getMarketStatusService,
  MarketStatus,
} from '@/lib/services/market'
import { createClient } from '@/lib/supabase/client'
import { Asset, Order, Holding, Trade } from '@/types'

export default function MarketPage() {
  const supabase = createClient()

  // Primary Market Data States
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [orderBook, setOrderBook] = useState<{ buyOrders: Order[]; sellOrders: Order[]; maxQuantity: number }>({
    buyOrders: [],
    sellOrders: [],
    maxQuantity: 1,
  })
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const [userCoins, setUserCoins] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // Order Placement Form State
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit')
  const [priceInput, setPriceInput] = useState<string>('')
  const [quantityInput, setQuantityInput] = useState<string>('')

  // My Orders Filter Tab
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'pending' | 'filled' | 'cancelled'>('pending')

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Single Source of Truth Fetch Function
  const loadMarketData = useCallback(async () => {
    try {
      const activeAssets = await getAssetsService()
      setAssets(activeAssets)

      let current = selectedAsset
        ? activeAssets.find((a) => a.id === selectedAsset.id) || activeAssets[0] || null
        : activeAssets[0] || null

      setSelectedAsset(current)

      if (current) {
        const book = await getOrderBookService(current.id)
        setOrderBook(book)

        const tradeHist = await getTradeHistoryService(current.id)
        setTrades(tradeHist)

        const mktStatus = await getMarketStatusService(current.id)
        setMarketStatus(mktStatus)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userHoldings = await getUserHoldingsService(user.id)
        setHoldings(userHoldings)

        const orders = await getUserOrdersService(user.id)
        setUserOrders(orders)

        const { data: profile } = await (supabase.from('profiles') as any).select('belmont_coins').eq('id', user.id).single()
        if (profile) {
          setUserCoins(profile.belmont_coins || 0)
        }
      }
    } catch (e) {
      console.error('Market data fetch error:', e)
    } finally {
      setIsLoading(false)
    }
  }, [selectedAsset, supabase])

  useEffect(() => {
    loadMarketData()
    // 6-second Polling Cycle
    const intervalId = setInterval(loadMarketData, 6000)
    return () => clearInterval(intervalId)
  }, [loadMarketData])

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setPriceInput(asset.current_price.toString())
    setQuantityInput('')
  }

  // Update default form price when market or asset changes
  useEffect(() => {
    if (selectedAsset) {
      if (orderType === 'market') {
        const estPrice = orderSide === 'buy'
          ? (orderBook.sellOrders[0]?.price || selectedAsset.current_price)
          : (orderBook.buyOrders[0]?.price || selectedAsset.current_price)
        setPriceInput(estPrice.toString())
      } else if (!priceInput || priceInput === '0') {
        setPriceInput(selectedAsset.current_price.toString())
      }
    }
  }, [selectedAsset, orderSide, orderType, orderBook])

  const handleSetMaxQuantity = () => {
    if (!selectedAsset) return
    const price = parseInt(priceInput) || selectedAsset.current_price || 1
    if (orderSide === 'buy') {
      const maxUnits = Math.floor(userCoins / price)
      setQuantityInput(Math.max(0, maxUnits).toString())
    } else {
      const userHolding = holdings.find((h) => h.asset_id === selectedAsset.id)
      setQuantityInput((userHolding?.quantity || 0).toString())
    }
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return

    const price = parseInt(priceInput)
    const quantity = parseInt(quantityInput)

    if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
      setFeedback({ type: 'error', message: 'Preço e quantidade devem ser inteiros maiores que zero.' })
      return
    }

    const res = await createOrderService(selectedAsset.id, orderSide, orderType, price, quantity)
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Ordem de ${orderSide === 'buy' ? 'COMPRA' : 'VENDA'} registrada com sucesso!`,
      })
      setQuantityInput('')
      await loadMarketData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao emitir ordem.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleCancelOrder = async (orderId: string) => {
    const res = await cancelOrderService(orderId)
    if (res.success) {
      setFeedback({ type: 'success', message: 'Ordem cancelada com sucesso!' })
      await loadMarketData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao cancelar ordem.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const bestBid = orderBook.buyOrders[0]?.price || 0
  const bestAsk = orderBook.sellOrders[0]?.price || 0
  const spread = bestAsk > 0 && bestBid > 0 ? Math.max(0, bestAsk - bestBid) : 0
  const calculatedCost = (parseInt(priceInput) || 0) * (parseInt(quantityInput) || 0)

  const userHoldingForSelected = holdings.find((h) => h.asset_id === selectedAsset?.id)
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.quantity * (h.asset?.current_price || 0), 0)

  const filteredUserOrders = userOrders.filter((ord) => {
    if (ordersFilter === 'all') return true
    return ord.status === ordersFilter
  })

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fadeIn pb-12 font-sans select-none">
      {/* 1. Ticker Row (Section 15: Compact Header Selector) */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-thin scrollbar-thumb-belmont-border">
        {assets.map((asset) => {
          const isSelected = selectedAsset?.id === asset.id
          const isPositive = asset.change_24h >= 0
          return (
            <button
              key={asset.id}
              onClick={() => handleSelectAsset(asset)}
              className={`min-w-[130px] flex-1 p-2.5 rounded-xl border transition-all text-left space-y-1 shrink-0 ${
                isSelected
                  ? 'bg-belmont-crimson/30 border-belmont-rose text-white shadow-belmont-glow font-bold'
                  : 'glass-panel border-belmont-border/70 hover:border-belmont-rose/40 text-belmont-text-secondary'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono tracking-wider font-bold text-belmont-text-primary">
                  {asset.symbol}
                </span>
                <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? `+${asset.change_24h}%` : `${asset.change_24h}%`}
                </span>
              </div>
              <p className="text-sm font-extrabold text-amber-300 font-mono">{asset.current_price} Coins</p>
            </button>
          )
        })}
      </div>

      {/* 2. Main Terminal Grid: Side-by-Side (Chart Left 68% + Book & Form Right 32%) */}
      {selectedAsset && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (8/12 = ~68% width): Chart + Recent Trades */}
          <div className="lg:col-span-8 space-y-4">
            {/* Lightweight Charts Component */}
            <CandleChart
              assetId={selectedAsset.id}
              currentPrice={selectedAsset.current_price}
              assetSymbol={selectedAsset.symbol}
              change24h={selectedAsset.change_24h}
            />

            {/* Recent Executed Trades Table (Section 17) */}
            <div className="glass-panel rounded-2xl p-4 border border-belmont-border space-y-3 bg-slate-950/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  Últimos Negócios Realizados ({selectedAsset.symbol})
                </h3>
                <span className="text-[10px] text-belmont-text-muted font-mono">
                  Somente Trades Executados
                </span>
              </div>

              {trades.length === 0 ? (
                <p className="text-xs text-belmont-text-muted text-center py-4 font-mono">Aguardando execuções no mercado.</p>
              ) : (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1 font-mono text-xs">
                  {trades.slice(0, 10).map((tr) => {
                    const totalValue = tr.price * tr.quantity
                    const timeStr = new Date(tr.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })

                    return (
                      <div
                        key={tr.id}
                        className="p-2 rounded-lg bg-belmont-surface/30 border border-belmont-border/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-belmont-text-muted text-[11px]">{timeStr}</span>
                          <span className="font-bold text-amber-300">{tr.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="text-belmont-text-secondary">{tr.quantity} un</span>
                          <span className="font-bold text-belmont-text-primary">{totalValue.toLocaleString('pt-BR')} Coins</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${tr.side === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {tr.side === 'buy' ? 'BUY' : 'SELL'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4/12 = ~32% width): Order Book + Compact Order Form */}
          <div className="lg:col-span-4 space-y-4">
            {/* Book de Ofertas Compacto (Section 16) */}
            <div className="glass-panel rounded-2xl p-4 border border-belmont-border space-y-3 bg-slate-950/60 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-belmont-border/70">
                <h3 className="text-xs font-bold text-belmont-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-belmont-rose" />
                  Livro de Ofertas
                </h3>
                <button onClick={loadMarketData} className="text-belmont-text-muted hover:text-white transition-colors">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {/* Asks (Sell Orders - Top Red) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-red-400 font-bold pb-1">
                  <span>ASKS (VENDA)</span>
                  <span>PREÇO / QTD</span>
                </div>
                {orderBook.sellOrders.length === 0 ? (
                  <p className="text-[10px] text-belmont-text-muted text-center py-2">Sem ordens de venda</p>
                ) : (
                  orderBook.sellOrders.slice(0, 4).map((ord) => {
                    const remaining = ord.quantity - ord.filled_quantity
                    const depthPct = Math.min(100, Math.max(5, (remaining / orderBook.maxQuantity) * 100))
                    return (
                      <div key={ord.id} className="relative flex items-center justify-between p-1 rounded overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 bg-red-500/10 pointer-events-none" style={{ width: `${depthPct}%` }} />
                        <span className="font-bold text-red-400 z-10">{ord.price.toFixed(2)}</span>
                        <span className="text-belmont-text-secondary z-10">{remaining} un</span>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Spread Indicator Line (Section 16) */}
              <div className="py-1.5 px-2 rounded-lg bg-belmont-surface/80 border border-belmont-border/80 flex items-center justify-between text-[11px]">
                <span className="text-belmont-text-muted">────── SPREAD ──────</span>
                <span className="font-bold text-amber-300">{spread.toFixed(2)} Coins</span>
              </div>

              {/* Bids (Buy Orders - Bottom Green) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-emerald-400 font-bold pb-1">
                  <span>BIDS (COMPRA)</span>
                  <span>PREÇO / QTD</span>
                </div>
                {orderBook.buyOrders.length === 0 ? (
                  <p className="text-[10px] text-belmont-text-muted text-center py-2">Sem ordens de compra</p>
                ) : (
                  orderBook.buyOrders.slice(0, 4).map((ord) => {
                    const remaining = ord.quantity - ord.filled_quantity
                    const depthPct = Math.min(100, Math.max(5, (remaining / orderBook.maxQuantity) * 100))
                    return (
                      <div key={ord.id} className="relative flex items-center justify-between p-1 rounded overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none" style={{ width: `${depthPct}%` }} />
                        <span className="font-bold text-emerald-400 z-10">{ord.price.toFixed(2)}</span>
                        <span className="text-belmont-text-secondary z-10">{remaining} un</span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Formulário Compacto de Ordens (Section 19) */}
            <div className="glass-panel rounded-2xl p-4 border border-belmont-border space-y-3 bg-slate-950/60 text-xs">
              {feedback && (
                <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {feedback.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Side Selector: COMPRAR | VENDER */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-belmont-surface/80 rounded-xl border border-belmont-border">
                <button
                  type="button"
                  onClick={() => setOrderSide('buy')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${orderSide === 'buy' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'text-belmont-text-muted hover:text-white'}`}
                >
                  COMPRAR
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSide('sell')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${orderSide === 'sell' ? 'bg-red-500 text-white font-extrabold' : 'text-belmont-text-muted hover:text-white'}`}
                >
                  VENDER
                </button>
              </div>

              {/* Type Selector: LIMIT | MARKET */}
              <div className="flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOrderType('limit')}
                    className={`px-2.5 py-0.5 rounded font-bold border transition-all ${orderType === 'limit' ? 'bg-belmont-surface border-belmont-rose text-white' : 'border-belmont-border/60 text-belmont-text-muted'}`}
                  >
                    LIMIT
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('market')}
                    className={`px-2.5 py-0.5 rounded font-bold border transition-all ${orderType === 'market' ? 'bg-belmont-surface border-belmont-rose text-white' : 'border-belmont-border/60 text-belmont-text-muted'}`}
                  >
                    MARKET
                  </button>
                </div>
                <span className="text-amber-300 font-bold">
                  {orderSide === 'buy' ? `${userCoins} Coins` : `${userHoldingForSelected?.quantity || 0} un`}
                </span>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-3">
                <Input
                  label="Preço (Coins)"
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  disabled={orderType === 'market'}
                  required
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-belmont-text-secondary">Quantidade</label>
                    <button type="button" onClick={handleSetMaxQuantity} className="text-[10px] font-bold text-amber-400 hover:underline uppercase">
                      [ Usar Máx ]
                    </button>
                  </div>
                  <Input type="number" placeholder="Ex: 10" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} required />
                </div>

                <div className="p-2 rounded-xl bg-belmont-surface/70 border border-belmont-border flex justify-between text-xs font-mono">
                  <span className="text-belmont-text-muted">{orderSide === 'buy' ? 'Custo:' : 'Recebível:'}</span>
                  <span className="font-bold text-amber-300">{calculatedCost.toLocaleString('pt-BR')} Coins</span>
                </div>

                <Button
                  type="submit"
                  variant={orderSide === 'buy' ? 'success' : 'crimson'}
                  size="md"
                  fullWidth
                  leftIcon={orderSide === 'buy' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                >
                  Confirmar {orderSide === 'buy' ? 'Compra' : 'Venda'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bottom Compact Row: Statistics + Orders + Holdings (Section 18 & 20) */}
      {selectedAsset && (
        <div className="space-y-4">
          {/* Faixa Compacta de Estatísticas 24h (Section 18) */}
          <div className="glass-panel p-3 rounded-2xl border border-belmont-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono bg-slate-950/50">
            <div>
              <span className="text-belmont-text-muted text-[10px] uppercase block">Último Preço</span>
              <span className="font-bold text-amber-300">{selectedAsset.current_price} Coins</span>
            </div>
            <div>
              <span className="text-belmont-text-muted text-[10px] uppercase block">Variação 24h</span>
              <span className={`font-bold ${selectedAsset.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {selectedAsset.change_24h >= 0 ? `+${selectedAsset.change_24h}%` : `${selectedAsset.change_24h}%`}
              </span>
            </div>
            <div>
              <span className="text-belmont-text-muted text-[10px] uppercase block">Máxima 24h</span>
              <span className="font-bold text-emerald-400">{selectedAsset.high_24h || selectedAsset.current_price}</span>
            </div>
            <div>
              <span className="text-belmont-text-muted text-[10px] uppercase block">Mínima 24h</span>
              <span className="font-bold text-red-400">{selectedAsset.low_24h || selectedAsset.current_price}</span>
            </div>
            <div>
              <span className="text-belmont-text-muted text-[10px] uppercase block">Volume 24h</span>
              <span className="font-bold text-amber-300">{selectedAsset.volume_24h?.toLocaleString('pt-BR') || 0} Coins</span>
            </div>
            <div>
              <span className="text-belmont-text-muted text-[10px] uppercase block">Trades 24h</span>
              <span className="font-bold text-belmont-text-primary">{selectedAsset.trades_24h_count || 0}</span>
            </div>
            <div>
              <span className="text-belmont-text-muted text-[10px] uppercase block">Spread</span>
              <span className="font-bold text-amber-300">{spread.toFixed(2)} Coins</span>
            </div>
          </div>

          {/* Minhas Ordens (Section 20 & 21: Estado Vazio Compacto) */}
          <div className="glass-panel rounded-2xl p-4 border border-belmont-border space-y-3 bg-slate-950/50">
            <div className="flex items-center justify-between pb-2 border-b border-belmont-border">
              <h3 className="text-xs font-bold font-mono text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-belmont-rose" />
                Minhas Ordens
              </h3>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                {([{ id: 'pending', label: 'ATIVAS' }, { id: 'filled', label: 'EXECUTADAS' }, { id: 'cancelled', label: 'CANCELADAS' }, { id: 'all', label: 'TODAS' }] as const).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrdersFilter(f.id)}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${ordersFilter === f.id ? 'bg-belmont-crimson text-white' : 'text-belmont-text-muted hover:text-white'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredUserOrders.length === 0 ? (
              /* Section 21: Compact Clean Empty State */
              <p className="text-xs text-belmont-text-muted py-2 font-mono">Você não possui ordens abertas.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs pr-1">
                {filteredUserOrders.map((ord) => (
                  <div key={ord.id} className="p-2 rounded-lg bg-belmont-surface/40 border border-belmont-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={ord.side === 'buy' ? 'success' : 'crimson'} size="sm">{ord.side.toUpperCase()}</Badge>
                      <span className="font-bold text-belmont-text-primary">{ord.asset?.symbol}</span>
                      <span className="text-[11px] text-belmont-text-muted">{ord.filled_quantity}/{ord.quantity} un @ {ord.price} Coins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ord.status === 'pending' ? 'gold' : 'outline'} size="sm">{ord.status.toUpperCase()}</Badge>
                      {ord.status === 'pending' && (
                        <button onClick={() => handleCancelOrder(ord.id)} className="text-red-400 hover:underline text-[10px] font-bold">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Portfolio Investments Summary */}
          {holdings.length > 0 && (
            <div className="glass-panel rounded-2xl p-4 border border-belmont-border space-y-3 bg-slate-950/50">
              <h3 className="text-xs font-bold font-mono text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                Seus Investimentos na Bolsa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {holdings.map((h) => {
                  const currentVal = h.quantity * (h.asset?.current_price || 0)
                  const costVal = h.quantity * h.average_price
                  const pnl = currentVal - costVal
                  const isProfit = pnl >= 0

                  return (
                    <div key={h.id} className="p-3 rounded-xl bg-belmont-surface/50 border border-belmont-border space-y-1 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-belmont-text-primary">{h.asset?.symbol}</span>
                        <Badge variant={isProfit ? 'success' : 'crimson'} size="sm">
                          {isProfit ? `+${pnl} Coins` : `${pnl} Coins`}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-belmont-text-muted">{h.quantity} unidades em carteira</p>
                      <p className="text-xs font-bold text-amber-300">Valor: {currentVal} Coins</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
