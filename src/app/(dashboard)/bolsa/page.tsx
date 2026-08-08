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
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  getAssetsService,
  getOrderBookService,
  getUserHoldingsService,
  getUserOrdersService,
  getTradeHistoryService,
  createOrderService,
} from '@/lib/services/market'
import { createClient } from '@/lib/supabase/client'
import { Asset, Order, Holding, Trade } from '@/types'

export default function MarketPage() {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [orderBook, setOrderBook] = useState<{ buyOrders: Order[]; sellOrders: Order[] }>({ buyOrders: [], sellOrders: [] })
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
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
  }, [])

  useEffect(() => {
    if (selectedAsset) {
      setPriceInput(selectedAsset.current_price.toString())
      getOrderBookService(selectedAsset.id).then(setOrderBook)
      getTradeHistoryService(selectedAsset.id).then(setTrades)
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
      setFeedback({ type: 'success', message: `Ordem de ${orderSide.toUpperCase()} registrada com sucesso na Bolsa!` })
      setQuantityInput('')
      await loadMarketData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao emitir ordem.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const userHoldingForCurrentAsset = holdings.find((h) => h.asset_id === selectedAsset?.id)
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + (h.quantity * (h.asset?.current_price || 0)), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header & Terminal Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-belmont-border relative overflow-hidden bg-mansion-radial">
        <div className="absolute top-0 right-0 w-96 h-96 bg-belmont-crimson/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Mercado Fictício da Mansão Belmont • Terminal Ativo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
              Bolsa Belmont
            </h1>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Negocie ativos fictícios com Belmont Coins, acompanhe a liquidez do book e gerencie seu portfólio.
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

      {/* Assets Selector Row */}
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

      {/* Main Terminal Grid: Order Book & Order Form */}
      {selectedAsset && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Selected Asset Header & Order Book */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Asset Info Card */}
            <div className="glass-panel p-6 rounded-3xl border border-belmont-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold font-display text-belmont-text-primary">
                      {selectedAsset.name} ({selectedAsset.symbol})
                    </h2>
                    <Badge variant={selectedAsset.change_24h >= 0 ? 'success' : 'crimson'} size="sm">
                      {selectedAsset.change_24h >= 0 ? `+${selectedAsset.change_24h}%` : `${selectedAsset.change_24h}%`}
                    </Badge>
                  </div>
                  <p className="text-xs text-belmont-text-muted mt-1">{selectedAsset.description}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-belmont-text-muted font-bold uppercase tracking-wider">Cotação Atual</p>
                  <p className="text-2xl font-extrabold text-amber-300 font-display">{selectedAsset.current_price} Coins</p>
                </div>
              </div>

              {/* Holding summary for this asset */}
              {userHoldingForCurrentAsset && (
                <div className="p-3 rounded-xl bg-belmont-surface/80 border border-belmont-border flex items-center justify-between text-xs">
                  <span className="text-belmont-text-secondary">Sua posição neste ativo:</span>
                  <span className="font-bold text-emerald-400">
                    {userHoldingForCurrentAsset.quantity} unidades (Preço Médio: {userHoldingForCurrentAsset.average_price} Coins)
                  </span>
                </div>
              )}
            </div>

            {/* Order Book Container */}
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-belmont-border">
                <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-belmont-rose" />
                  Book de Ordens — {selectedAsset.symbol}
                </h3>

                <button
                  onClick={loadMarketData}
                  className="p-1.5 text-belmont-text-muted hover:text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Buy Orders (Bids) */}
                <div className="space-y-2 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center justify-between font-bold text-emerald-400 pb-2 border-b border-emerald-500/20">
                    <span>Ofertas de Compra (Bids)</span>
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
                    <span>Ofertas de Venda (Asks)</span>
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
            </div>
          </div>

          {/* Right Column: Order Placement Form */}
          <div className="space-y-6">
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

              {/* Type Selector: Market vs Limit */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === 'market'}
                    onChange={() => setOrderType('market')}
                    className="accent-belmont-rose"
                  />
                  <span>Mercado</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === 'limit'}
                    onChange={() => setOrderType('limit')}
                    className="accent-belmont-rose"
                  />
                  <span>Limitada</span>
                </label>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <Input
                  label="Preço por Unidade (Coins)"
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  disabled={orderType === 'market'}
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

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant={orderSide === 'buy' ? 'success' : 'crimson'}
                    size="md"
                    fullWidth
                    leftIcon={orderSide === 'buy' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  >
                    Confirmar {orderSide === 'buy' ? 'Compra' : 'Venda'}
                  </Button>
                </div>
              </form>
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
