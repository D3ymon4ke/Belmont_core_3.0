'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
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
  Users,
  Shield,
  Clock,
  Info,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
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
  getNpcParticipantsService,
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
  const [npcTrades, setNpcTrades] = useState<{ id: string; agentName: string; side: 'buy' | 'sell'; assetSymbol: string; price: number; quantity: number; createdAt: string }[]>([])
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

  // Fetch complete market state
  const loadMarketData = useCallback(async () => {
    try {
      const activeAssets = await getAssetsService()
      setAssets(activeAssets)

      // Retain currently selected asset or fallback to first
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

      const npcs = await getNpcParticipantsService()
      setNpcTrades(npcs)

      // Fetch User Portfolio & Profile Coins
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

    // 7-second Polling Cycle for Smart Refresh
    const intervalId = setInterval(() => {
      loadMarketData()
    }, 7000)

    return () => clearInterval(intervalId)
  }, [loadMarketData])

  // Handle Asset Switch
  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setPriceInput(asset.current_price.toString())
    setQuantityInput('')
  }

  // Set default price when asset changes or side/type changes
  useEffect(() => {
    if (selectedAsset) {
      if (orderType === 'market') {
        const topPrice = orderSide === 'buy'
          ? (orderBook.sellOrders[0]?.price || selectedAsset.current_price)
          : (orderBook.buyOrders[0]?.price || selectedAsset.current_price)
        setPriceInput(topPrice.toString())
      } else if (!priceInput || priceInput === '0') {
        setPriceInput(selectedAsset.current_price.toString())
      }
    }
  }, [selectedAsset, orderSide, orderType, orderBook])

  // Max Quantity Calculator
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

  // Handle Order Submission
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
        message: `Ordem de ${orderSide === 'buy' ? 'COMPRA' : 'VENDA'} (${orderType.toUpperCase()}) registrada com sucesso!`,
      })
      setQuantityInput('')
      await loadMarketData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao emitir ordem.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  // Handle Order Cancellation
  const handleCancelOrder = async (orderId: string) => {
    const res = await cancelOrderService(orderId)
    if (res.success) {
      setFeedback({ type: 'success', message: 'Ordem cancelada e saldo estornado com sucesso!' })
      await loadMarketData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao cancelar ordem.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  // Orderbook Spread Calculations
  const bestBid = orderBook.buyOrders[0]?.price || 0
  const bestAsk = orderBook.sellOrders[0]?.price || 0
  const spread = bestAsk > 0 && bestBid > 0 ? Math.max(0, bestAsk - bestBid) : 0

  const calculatedCost = (parseInt(priceInput) || 0) * (parseInt(quantityInput) || 0)

  const userHoldingForSelected = holdings.find((h) => h.asset_id === selectedAsset?.id)
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.quantity * (h.asset?.current_price || 0), 0)

  // Filtered Orders List
  const filteredUserOrders = userOrders.filter((ord) => {
    if (ordersFilter === 'all') return true
    return ord.status === ordersFilter
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12 font-sans select-none">
      {/* Header & Terminal Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-belmont-border relative overflow-hidden bg-mansion-radial">
        <div className="absolute top-0 right-0 w-96 h-96 bg-belmont-crimson/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Terminal Financeiro Belmont Core 2.0</span>
              </div>
              {marketStatus && (
                <span
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                    marketStatus.isActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <Activity className={`w-3.5 h-3.5 ${marketStatus.isActive ? 'animate-pulse' : ''}`} />
                  {marketStatus.statusText}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
              Bolsa Belmont
            </h1>
            <p className="text-xs sm:text-sm text-belmont-text-secondary max-w-xl">
              Cotações reais derivadas diretamente do Market Engine & Trades do Supabase. Liquidez garantida com livro de ofertas transparente.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-belmont-surface/90 p-4 rounded-2xl border border-belmont-border shadow-lg">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-belmont-text-muted font-bold uppercase tracking-wider">Investimentos Totais</p>
              <p className="text-xl font-extrabold text-amber-300 font-display">{totalHoldingsValue} Coins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Ticker Cards Row (Requirement 19 & 23: Mobile Scrollable) */}
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-belmont-border">
        {assets.map((asset) => {
          const isSelected = selectedAsset?.id === asset.id
          const isPositive = asset.change_24h >= 0
          return (
            <button
              key={asset.id}
              onClick={() => handleSelectAsset(asset)}
              className={`min-w-[140px] flex-1 p-3.5 rounded-2xl border transition-all text-left space-y-1.5 shrink-0 ${
                isSelected
                  ? 'bg-belmont-crimson/25 border-belmont-rose text-white shadow-belmont-glow scale-102'
                  : 'glass-panel border-belmont-border/70 hover:border-belmont-rose/40 text-belmont-text-secondary'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-display tracking-wider text-belmont-text-primary">
                  {asset.symbol}
                </span>
                <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? `+${asset.change_24h}%` : `${asset.change_24h}%`}
                </span>
              </div>
              <p className="text-sm font-extrabold text-amber-300 font-display">{asset.current_price} Coins</p>
            </button>
          )
        })}
      </div>

      {/* Main Terminal Area */}
      {selectedAsset && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Asset Header + Chart + Order Book + Recent Trades */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Header Bar & 24h Market Statistics (Requirement 1, 18 & 19) */}
            <div className="glass-panel p-5 rounded-3xl border border-belmont-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-belmont-border">
                <div>
                  <h2 className="text-xl font-bold font-display text-belmont-text-primary flex items-center gap-2">
                    {selectedAsset.name}
                    <span className="px-2 py-0.5 rounded-md bg-belmont-surface border border-belmont-border text-xs text-amber-300 font-mono">
                      {selectedAsset.symbol}
                    </span>
                  </h2>
                  <p className="text-xs text-belmont-text-muted mt-0.5">{selectedAsset.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-belmont-text-muted font-bold uppercase">Cotação Atual (Last Trade)</p>
                    <p className="text-2xl font-extrabold text-amber-300 font-display">{selectedAsset.current_price} Coins</p>
                  </div>
                </div>
              </div>

              {/* 24h Financial Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-belmont-surface/50 border border-belmont-border/70">
                  <p className="text-[10px] text-belmont-text-muted font-bold uppercase">Variação 24h</p>
                  <p className={`font-bold ${selectedAsset.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedAsset.change_24h >= 0 ? `+${selectedAsset.change_24h}%` : `${selectedAsset.change_24h}%`}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-belmont-surface/50 border border-belmont-border/70">
                  <p className="text-[10px] text-belmont-text-muted font-bold uppercase">Máxima 24h</p>
                  <p className="font-bold text-emerald-400">{selectedAsset.high_24h || selectedAsset.current_price} Coins</p>
                </div>

                <div className="p-2.5 rounded-xl bg-belmont-surface/50 border border-belmont-border/70">
                  <p className="text-[10px] text-belmont-text-muted font-bold uppercase">Mínima 24h</p>
                  <p className="font-bold text-red-400">{selectedAsset.low_24h || selectedAsset.current_price} Coins</p>
                </div>

                <div className="p-2.5 rounded-xl bg-belmont-surface/50 border border-belmont-border/70">
                  <p className="text-[10px] text-belmont-text-muted font-bold uppercase">Volume 24h Real</p>
                  <p className="font-bold text-amber-300">{selectedAsset.volume_24h?.toLocaleString('pt-BR') || 0} Coins</p>
                </div>

                <div className="p-2.5 rounded-xl bg-belmont-surface/50 border border-belmont-border/70 col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-belmont-text-muted font-bold uppercase">Trades 24h</p>
                  <p className="font-bold text-belmont-text-primary">{selectedAsset.trades_24h_count || 0} negócios</p>
                </div>
              </div>
            </div>

            {/* TradingView-Style Candlestick Chart Component (Requirement 3 to 12) */}
            <CandleChart
              assetId={selectedAsset.id}
              currentPrice={selectedAsset.current_price}
              assetSymbol={selectedAsset.symbol}
            />

            {/* Professional Order Book with Depth Fill Bars (Requirement 14) */}
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-belmont-border">
                <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-belmont-rose" />
                  Livro de Ofertas (Order Book)
                </h3>

                <button
                  onClick={loadMarketData}
                  className="p-1.5 text-belmont-text-muted hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Buy Orders (Bids) */}
                <div className="space-y-1.5 bg-emerald-500/5 p-3.5 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center justify-between font-bold text-emerald-400 pb-2 border-b border-emerald-500/20 text-[11px]">
                    <span>COMPRAS (BIDS)</span>
                    <span>PREÇO / QTD / TOTAL</span>
                  </div>

                  {orderBook.buyOrders.length === 0 ? (
                    <p className="text-[11px] text-belmont-text-muted text-center py-6 font-sans">Sem ofertas de compra ativas.</p>
                  ) : (
                    orderBook.buyOrders.map((ord) => {
                      const remaining = ord.quantity - ord.filled_quantity
                      const totalVal = ord.price * remaining
                      const depthPct = Math.min(100, Math.max(5, (remaining / orderBook.maxQuantity) * 100))

                      return (
                        <div
                          key={ord.id}
                          className="relative flex items-center justify-between p-1.5 rounded-lg overflow-hidden group"
                        >
                          {/* Relative Depth Fill Bar */}
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 transition-all pointer-events-none"
                            style={{ width: `${depthPct}%` }}
                          />
                          <span className="font-bold text-emerald-400 z-10">{ord.price} Coins</span>
                          <div className="flex items-center gap-3 text-belmont-text-secondary z-10 text-[11px]">
                            <span>{remaining} un</span>
                            <span className="text-belmont-text-muted font-normal">{totalVal} Coins</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Sell Orders (Asks) */}
                <div className="space-y-1.5 bg-red-500/5 p-3.5 rounded-2xl border border-red-500/20">
                  <div className="flex items-center justify-between font-bold text-red-400 pb-2 border-b border-red-500/20 text-[11px]">
                    <span>VENDAS (ASKS)</span>
                    <span>PREÇO / QTD / TOTAL</span>
                  </div>

                  {orderBook.sellOrders.length === 0 ? (
                    <p className="text-[11px] text-belmont-text-muted text-center py-6 font-sans">Sem ofertas de venda ativas.</p>
                  ) : (
                    orderBook.sellOrders.map((ord) => {
                      const remaining = ord.quantity - ord.filled_quantity
                      const totalVal = ord.price * remaining
                      const depthPct = Math.min(100, Math.max(5, (remaining / orderBook.maxQuantity) * 100))

                      return (
                        <div
                          key={ord.id}
                          className="relative flex items-center justify-between p-1.5 rounded-lg overflow-hidden group"
                        >
                          {/* Relative Depth Fill Bar */}
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-red-500/15 transition-all pointer-events-none"
                            style={{ width: `${depthPct}%` }}
                          />
                          <span className="font-bold text-red-400 z-10">{ord.price} Coins</span>
                          <div className="flex items-center gap-3 text-belmont-text-secondary z-10 text-[11px]">
                            <span>{remaining} un</span>
                            <span className="text-belmont-text-muted font-normal">{totalVal} Coins</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Spread Indicator Bar */}
              <div className="p-3 rounded-2xl bg-belmont-surface/90 border border-belmont-border flex items-center justify-between text-xs font-mono">
                <span className="text-belmont-text-secondary">
                  Melhor Bid: <strong className="text-emerald-400">{bestBid || '—'} Coins</strong>
                </span>
                <span className="text-amber-300 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                  SPREAD: {spread} Coins
                </span>
                <span className="text-belmont-text-secondary">
                  Melhor Ask: <strong className="text-red-400">{bestAsk || '—'} Coins</strong>
                </span>
              </div>
            </div>

            {/* Recent Executed Trades Table (Requirement 17) */}
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                Últimos Negócios Executados ({selectedAsset.symbol})
              </h3>

              {trades.length === 0 ? (
                <EmptyState
                  icon={<History className="w-5 h-5 text-amber-400" />}
                  title="Aguardando negociações no mercado."
                  description="Os trades reais executados pelo Engine aparecerão aqui."
                />
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {trades.map((tr) => {
                    const totalValue = tr.price * tr.quantity
                    const timeStr = new Date(tr.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })

                    return (
                      <div
                        key={tr.id}
                        className="p-3 rounded-xl bg-belmont-surface/40 border border-belmont-border/60 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-belmont-text-muted text-[11px]">{timeStr}</span>
                          <span className="font-bold text-amber-300">{tr.price.toFixed(2)} Coins</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-belmont-text-secondary">{tr.quantity} un</span>
                          <span className="font-bold text-belmont-text-primary">{totalValue.toLocaleString('pt-BR')} Coins</span>
                          <Badge variant={tr.side === 'buy' ? 'success' : 'crimson'} size="sm">
                            {tr.side === 'buy' ? 'BUY' : 'SELL'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* NPC Participants Section (Requirement 21) */}
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-belmont-rose" />
                Atividade dos Participantes NPC (Market Makers)
              </h3>

              {npcTrades.length === 0 ? (
                <p className="text-xs text-belmont-text-muted">Aguardando ofertas dos agentes autônomos.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {npcTrades.slice(0, 6).map((npc) => (
                    <div
                      key={npc.id}
                      className="p-3 rounded-2xl bg-belmont-surface/50 border border-belmont-border space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-belmont-text-primary">{npc.agentName}</span>
                        <Badge variant={npc.side === 'buy' ? 'success' : 'crimson'} size="sm">
                          {npc.side === 'buy' ? 'COMPRA' : 'VENDA'}
                        </Badge>
                      </div>
                      <p className="text-belmont-text-secondary text-[11px]">
                        {npc.quantity} {npc.assetSymbol} @ <strong className="text-amber-300">{npc.price} Coins</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Placement Form & My Orders */}
          <div className="space-y-6">
            {/* Enhanced Order Placement Form (Requirement 15) */}
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center justify-between">
                <span>Emitir Ordem</span>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  {orderSide === 'buy' ? `${userCoins} Coins Disponíveis` : `${userHoldingForSelected?.quantity || 0} un Disponíveis`}
                </span>
              </h3>

              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}
                >
                  {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Order Side Selector: Buy vs Sell */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-belmont-surface/80 rounded-xl border border-belmont-border">
                <button
                  type="button"
                  onClick={() => setOrderSide('buy')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    orderSide === 'buy' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-belmont-text-muted hover:text-white'
                  }`}
                >
                  Comprar
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSide('sell')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    orderSide === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-belmont-text-muted hover:text-white'
                  }`}
                >
                  Vender
                </button>
              </div>

              {/* Order Type Selector: Limit vs Market */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-belmont-text-muted">Tipo:</span>
                <button
                  type="button"
                  onClick={() => setOrderType('limit')}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                    orderType === 'limit'
                      ? 'bg-belmont-surface border-belmont-rose text-white'
                      : 'border-belmont-border/60 text-belmont-text-muted hover:text-white'
                  }`}
                >
                  LIMIT
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('market')}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                    orderType === 'market'
                      ? 'bg-belmont-surface border-belmont-rose text-white'
                      : 'border-belmont-border/60 text-belmont-text-muted hover:text-white'
                  }`}
                >
                  MARKET
                </button>
              </div>

              {orderType === 'market' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Ordem a Mercado: O preço é estimado com base no melhor topo do livro de ofertas. A execução dependerá da liquidez disponível.
                  </span>
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <Input
                  label="Preço por Unidade (Coins)"
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  disabled={orderType === 'market'}
                  required
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-belmont-text-secondary">Quantidade de Unidades</label>
                    <button
                      type="button"
                      onClick={handleSetMaxQuantity}
                      className="text-[10px] font-bold text-amber-400 hover:underline uppercase"
                    >
                      [ Usar Máximo ]
                    </button>
                  </div>
                  <Input
                    type="number"
                    placeholder="Ex: 10"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    required
                  />
                </div>

                {/* Estimated Total Calculation */}
                <div className="p-3 rounded-xl bg-belmont-surface/70 border border-belmont-border space-y-1 text-xs">
                  <div className="flex justify-between text-belmont-text-secondary">
                    <span>{orderSide === 'buy' ? 'Custo Estimado:' : 'Recebível Estimado:'}</span>
                    <span className="font-bold text-amber-300 font-mono">{calculatedCost.toLocaleString('pt-BR')} Coins</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant={orderSide === 'buy' ? 'success' : 'crimson'}
                  size="md"
                  fullWidth
                  leftIcon={orderSide === 'buy' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                >
                  Confirmar {orderSide === 'buy' ? 'Compra' : 'Venda'}
                </Button>
              </form>
            </div>

            {/* Filterable User Orders Panel (Requirement 16) */}
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-belmont-border">
                <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-belmont-rose" />
                  Minhas Ordens
                </h3>

                {/* Order Status Filters */}
                <div className="flex items-center gap-1 text-[11px]">
                  {(
                    [
                      { id: 'pending', label: 'ATIVAS' },
                      { id: 'filled', label: 'EXECUTADAS' },
                      { id: 'cancelled', label: 'CANCELADAS' },
                      { id: 'all', label: 'TODAS' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOrdersFilter(f.id)}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        ordersFilter === f.id
                          ? 'bg-belmont-crimson text-white'
                          : 'text-belmont-text-muted hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredUserOrders.length === 0 ? (
                <p className="text-xs text-belmont-text-muted py-4">Nenhuma ordem encontrada neste filtro.</p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredUserOrders.map((ord) => {
                    const remaining = ord.quantity - ord.filled_quantity
                    const timeStr = new Date(ord.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl bg-belmont-surface/50 border border-belmont-border space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={ord.side === 'buy' ? 'success' : 'crimson'} size="sm">
                              {ord.side.toUpperCase()}
                            </Badge>
                            <span className="font-bold text-belmont-text-primary">{ord.asset?.symbol}</span>
                            <span className="text-[10px] text-belmont-text-muted uppercase">({ord.order_type})</span>
                          </div>
                          <Badge
                            variant={ord.status === 'pending' ? 'gold' : ord.status === 'filled' ? 'success' : 'outline'}
                            size="sm"
                          >
                            {ord.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-belmont-text-muted font-mono text-[11px]">
                          <span>
                            {ord.filled_quantity}/{ord.quantity} un @ {ord.price} Coins
                          </span>
                          <span>{timeStr}</span>
                        </div>

                        {ord.status === 'pending' && (
                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => handleCancelOrder(ord.id)}
                              className="text-red-400 hover:text-red-300 text-[10px] font-bold flex items-center gap-1 hover:underline"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancelar Ordem
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Portfolio Holdings Summary */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
        <h3 className="text-base font-bold font-display text-belmont-text-primary flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-amber-400" />
          Seus Investimentos em Ativos da Mansão
        </h3>

        {holdings.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-6 h-6 text-amber-400" />}
            title="Sua carteira de ativos está vazia."
            description="Emita ordens de compra na Bolsa Belmont para começar a investir."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {holdings.map((h) => {
              const currentVal = h.quantity * (h.asset?.current_price || 0)
              const costVal = h.quantity * h.average_price
              const pnl = currentVal - costVal
              const isProfit = pnl >= 0

              return (
                <div key={h.id} className="p-4 rounded-2xl bg-belmont-surface/60 border border-belmont-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-display text-belmont-text-primary">{h.asset?.symbol}</span>
                    <Badge variant={isProfit ? 'success' : 'crimson'} size="sm">
                      {isProfit ? `+${pnl} Coins` : `${pnl} Coins`}
                    </Badge>
                  </div>
                  <p className="text-xs text-belmont-text-muted">{h.quantity} unidades em carteira</p>
                  <p className="text-sm font-extrabold text-amber-300 font-display">Valor Atual: {currentVal} Coins</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
