'use client'

import React, { useState, useEffect } from 'react'
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
  Newspaper,
  Calendar,
  XCircle,
  Activity,
  Layers,
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
} from '@/lib/services/market'
import { getNewsArticlesService } from '@/lib/services/news'
import { createClient } from '@/lib/supabase/client'
import { Asset, Order, Holding, Trade, NewsArticle } from '@/types'

export default function MarketPage() {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [orderBook, setOrderBook] = useState<{ buyOrders: Order[]; sellOrders: Order[] }>({ buyOrders: [], sellOrders: [] })
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Order Form State
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [priceInput, setPriceInput] = useState<string>('')
  const [quantityInput, setQuantityInput] = useState<string>('')

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadMarketData = async () => {
    setIsLoading(true)
    const activeAssets = await getAssetsService()
    setAssets(activeAssets)

    const current = selectedAsset || activeAssets[0] || null
    setSelectedAsset(current)

    if (current) {
      const book = await getOrderBookService(current.id)
      setOrderBook(book)

      const tradeHist = await getTradeHistoryService(current.id)
      setTrades(tradeHist)

      const relatedNews = await getNewsArticlesService(current.id)
      setNews(relatedNews)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const userHoldings = await getUserHoldingsService(user.id)
      setHoldings(userHoldings)

      const orders = await getUserOrdersService(user.id)
      setUserOrders(orders)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadMarketData()

    // 10s Polling Loop
    const intervalId = setInterval(() => {
      if (selectedAsset) {
        getOrderBookService(selectedAsset.id).then(setOrderBook)
        getTradeHistoryService(selectedAsset.id).then(setTrades)
      }
    }, 10000)

    return () => clearInterval(intervalId)
  }, [selectedAsset])

  useEffect(() => {
    if (selectedAsset) {
      setPriceInput(selectedAsset.current_price.toString())
      getOrderBookService(selectedAsset.id).then(setOrderBook)
      getTradeHistoryService(selectedAsset.id).then(setTrades)
      getNewsArticlesService(selectedAsset.id).then(setNews)
    }
  }, [selectedAsset])

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setPriceInput(asset.current_price.toString())
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return

    const price = parseInt(priceInput)
    const quantity = parseInt(quantityInput)

    if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
      setFeedback({ type: 'error', message: 'Preço e quantidade devem ser valores inteiros maiores que zero.' })
      return
    }

    const res = await createOrderService(selectedAsset.id, orderSide, orderType, price, quantity)
    if (res.success) {
      setFeedback({ type: 'success', message: `Ordem de ${orderSide.toUpperCase()} registrada com sucesso!` })
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
      setFeedback({ type: 'success', message: 'Ordem cancelada e saldo estornado com sucesso!' })
      await loadMarketData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao cancelar ordem.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const userHoldingForCurrentAsset = holdings.find((h) => h.asset_id === selectedAsset?.id)
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + (h.quantity * (h.asset?.current_price || 0)), 0)

  // Calculate Spread
  const bestBid = orderBook.buyOrders[0]?.price || 0
  const bestAsk = orderBook.sellOrders[0]?.price || 0
  const spread = bestAsk > 0 && bestBid > 0 ? Math.max(0, bestAsk - bestBid) : 0

  const calculatedCost = (parseInt(priceInput) || 0) * (parseInt(quantityInput) || 0)

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header & Terminal Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-belmont-border relative overflow-hidden bg-mansion-radial">
        <div className="absolute top-0 right-0 w-96 h-96 bg-belmont-crimson/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Mercado Vivo • Engine 24/7 na VPS</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                MERCADO ATIVO
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
              Bolsa Belmont
            </h1>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Terminal financeiro autônomo com liquidez contínua dos NPCs, livro de ofertas e gráficos de Candlesticks.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-belmont-surface/90 p-4 rounded-2xl border border-belmont-border shadow-lg">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-belmont-text-muted font-bold uppercase tracking-wider">Valor dos Investimentos</p>
              <p className="text-xl font-extrabold text-amber-300 font-display">{totalHoldingsValue} Coins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Selector Ticker Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {assets.map((asset) => {
          const isSelected = selectedAsset?.id === asset.id
          const isPositive = asset.change_24h >= 0
          return (
            <button
              key={asset.id}
              onClick={() => handleSelectAsset(asset)}
              className={`p-3.5 rounded-2xl border transition-all text-left space-y-1 ${
                isSelected
                  ? 'bg-belmont-crimson/25 border-belmont-rose text-white shadow-belmont-glow scale-105'
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

      {/* Main Terminal Grid: Candlestick Chart + Order Book + Order Form */}
      {selectedAsset && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Candlestick Chart & Professional Order Book */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Ticker Info Bar */}
            <div className="glass-panel p-5 rounded-3xl border border-belmont-border flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display text-belmont-text-primary">
                  {selectedAsset.name} ({selectedAsset.symbol})
                </h2>
                <p className="text-xs text-belmont-text-muted">{selectedAsset.description}</p>
              </div>

              <div className="flex items-center gap-6 text-right text-xs">
                <div>
                  <p className="text-[10px] text-belmont-text-muted font-bold uppercase">Cotação Atual</p>
                  <p className="text-lg font-extrabold text-amber-300 font-display">{selectedAsset.current_price} Coins</p>
                </div>
                <div>
                  <p className="text-[10px] text-belmont-text-muted font-bold uppercase">Volume 24h</p>
                  <p className="text-sm font-bold text-belmont-text-primary font-display">{selectedAsset.volume_24h || 0} Coins</p>
                </div>
                <div>
                  <p className="text-[10px] text-belmont-text-muted font-bold uppercase">Variação 24h</p>
                  <span className={`font-bold ${selectedAsset.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedAsset.change_24h >= 0 ? `+${selectedAsset.change_24h}%` : `${selectedAsset.change_24h}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Real Candlestick Chart Component */}
            <CandleChart assetId={selectedAsset.id} currentPrice={selectedAsset.current_price} />

            {/* Professional Order Book with Spread */}
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-belmont-border">
                <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-belmont-rose" />
                  Livro de Ofertas com Spread (Profissional)
                </h3>

                <button onClick={loadMarketData} className="p-1.5 text-belmont-text-muted hover:text-white rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Buy Orders (Bids) */}
                <div className="space-y-2 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center justify-between font-bold text-emerald-400 pb-2 border-b border-emerald-500/20">
                    <span>Compras (Bids)</span>
                    <span>Preço / Qtd</span>
                  </div>

                  {orderBook.buyOrders.length === 0 ? (
                    <p className="text-[11px] text-belmont-text-muted text-center py-4">Sem ofertas de compra no momento.</p>
                  ) : (
                    orderBook.buyOrders.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between text-belmont-text-secondary">
                        <span className="font-semibold text-emerald-300">{ord.price} Coins</span>
                        <span>{ord.quantity} un</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Sell Orders (Asks) */}
                <div className="space-y-2 bg-red-500/5 p-3 rounded-2xl border border-red-500/20">
                  <div className="flex items-center justify-between font-bold text-red-400 pb-2 border-b border-red-500/20">
                    <span>Vendas (Asks)</span>
                    <span>Preço / Qtd</span>
                  </div>

                  {orderBook.sellOrders.length === 0 ? (
                    <p className="text-[11px] text-belmont-text-muted text-center py-4">Sem ofertas de venda no momento.</p>
                  ) : (
                    orderBook.sellOrders.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between text-belmont-text-secondary">
                        <span className="font-semibold text-red-300">{ord.price} Coins</span>
                        <span>{ord.quantity} un</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Spread Indicator Bar */}
              <div className="p-3 rounded-2xl bg-belmont-surface/90 border border-belmont-border flex items-center justify-between text-xs font-semibold">
                <span className="text-belmont-text-secondary">Melhor Bid: <strong className="text-emerald-400">{bestBid || '—'} Coins</strong></span>
                <span className="text-amber-300 font-bold">Spread: {spread} Coins</span>
                <span className="text-belmont-text-secondary">Melhor Ask: <strong className="text-red-400">{bestAsk || '—'} Coins</strong></span>
              </div>
            </div>

            {/* Recent Trades Table */}
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
                <div className="space-y-2">
                  {trades.map((tr) => (
                    <div key={tr.id} className="p-3 rounded-xl bg-belmont-surface/40 border border-belmont-border/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <Badge variant="gold" size="sm">TRADE</Badge>
                        <span className="text-belmont-text-primary font-bold">{tr.quantity} un @ {tr.price} Coins</span>
                      </div>
                      <span className="text-[10px] text-belmont-text-muted">
                        {new Date(tr.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Placement & User Orders */}
          <div className="space-y-6">
            {/* Order Placement Form */}
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider">
                Emitir Ordem de Negociação
              </h3>

              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}
                >
                  {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Side Selector: Buy vs Sell */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-belmont-surface/80 rounded-xl border border-belmont-border">
                <button
                  type="button"
                  onClick={() => setOrderSide('buy')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    orderSide === 'buy' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-belmont-text-muted hover:text-white'
                  }`}
                >
                  Comprar
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSide('sell')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    orderSide === 'sell' ? 'bg-red-500 text-white shadow-sm' : 'text-belmont-text-muted hover:text-white'
                  }`}
                >
                  Vender
                </button>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <Input
                  label="Preço por Unidade (Coins)"
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  required
                />

                <Input
                  label="Quantidade de Unidades"
                  type="number"
                  placeholder="Ex: 10"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  required
                />

                {/* Estimated Cost Summary */}
                <div className="p-3 rounded-xl bg-belmont-surface/70 border border-belmont-border space-y-1 text-xs">
                  <div className="flex justify-between text-belmont-text-secondary">
                    <span>Custo Estimado:</span>
                    <span className="font-bold text-amber-300">{calculatedCost} Coins</span>
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

            {/* User Orders & Cancellation Panel */}
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-belmont-rose" />
                Minhas Ordens
              </h3>

              {userOrders.length === 0 ? (
                <p className="text-xs text-belmont-text-muted">Você não possui ordens registradas no momento.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userOrders.map((ord) => (
                    <div key={ord.id} className="p-3 rounded-xl bg-belmont-surface/50 border border-belmont-border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={ord.side === 'buy' ? 'success' : 'crimson'} size="sm">
                            {ord.side.toUpperCase()}
                          </Badge>
                          <span className="font-bold text-belmont-text-primary">{ord.asset?.symbol}</span>
                        </div>
                        <Badge variant={ord.status === 'pending' ? 'gold' : 'outline'} size="sm">
                          {ord.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-belmont-text-muted">
                        <span>{ord.filled_quantity}/{ord.quantity} un @ {ord.price} Coins</span>
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="text-red-400 hover:underline text-[10px] font-bold flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Portfolio Holdings Section */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
        <h3 className="text-base font-bold font-display text-belmont-text-primary flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-amber-400" />
          Seus Investimentos na Bolsa
        </h3>

        {holdings.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-6 h-6 text-amber-400" />}
            title="Sua carteira de ativos está vazia."
            description="Compre ativos fictícios na Bolsa Belmont para começar a investir."
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
