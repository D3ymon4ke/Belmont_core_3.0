'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Candle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface CandleChartProps {
  assetId: string
  currentPrice: number
}

export const CandleChart: React.FC<CandleChartProps> = ({ assetId, currentPrice }) => {
  const supabase = createClient()
  const [interval, setInterval] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('1m')
  const [candles, setCandles] = useState<Candle[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchRealCandles() {
      setIsLoading(true)
      try {
        // Query real asset price logs from Supabase
        const { data: priceLogs } = await (supabase
          .from('asset_prices') as any)
          .select('*')
          .eq('asset_id', assetId)
          .order('created_at', { ascending: true })
          .limit(100)

        if (!priceLogs || priceLogs.length === 0) {
          // If zero trades yet, display single current price candle
          setCandles([
            {
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              open: currentPrice,
              high: currentPrice,
              low: currentPrice,
              close: currentPrice,
              volume: 0,
            },
          ])
          setIsLoading(false)
          return
        }

        // Aggregate into candlestick bars
        const aggregated: Candle[] = []
        const bucketSize = interval === '1m' ? 1 : interval === '5m' ? 5 : interval === '15m' ? 15 : interval === '1h' ? 60 : 1440

        for (let i = 0; i < priceLogs.length; i += Math.max(1, Math.floor(bucketSize / 2))) {
          const slice = priceLogs.slice(i, i + Math.max(1, Math.floor(bucketSize / 2)))
          if (slice.length === 0) continue

          const prices = slice.map((p: any) => p.price)
          const open = prices[0]
          const close = prices[prices.length - 1]
          const high = Math.max(...prices)
          const low = Math.min(...prices)
          const volume = slice.reduce((sum: number, p: any) => sum + (p.volume || 1), 0)
          const time = new Date(slice[0].created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

          aggregated.push({ time, open, high, low, close, volume })
        }

        setCandles(aggregated.slice(-15))
      } catch (e) {
        setCandles([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRealCandles()
  }, [assetId, interval, currentPrice])

  const maxPrice = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) + 2 : currentPrice + 5
  const minPrice = candles.length > 0 ? Math.max(1, Math.min(...candles.map((c) => c.low)) - 2) : Math.max(1, currentPrice - 5)
  const priceRange = Math.max(1, maxPrice - minPrice)

  return (
    <div className="glass-panel p-5 rounded-3xl border border-belmont-border space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-belmont-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-belmont-rose" />
          <span className="text-xs font-bold font-display uppercase tracking-wider text-belmont-text-primary">
            Gráfico de Candlesticks (Dados Reais)
          </span>
        </div>

        {/* Interval Selector */}
        <div className="flex items-center gap-1 p-1 bg-belmont-surface/80 rounded-xl border border-belmont-border text-xs">
          {(['1m', '5m', '15m', '1h', '1D'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setInterval(tf)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                interval === tf ? 'bg-belmont-crimson text-white shadow-sm' : 'text-belmont-text-muted hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Candlesticks Chart */}
      <div className="h-48 sm:h-56 w-full relative flex items-end justify-between gap-2 pt-6 pb-4 px-2 bg-belmont-bg/60 rounded-2xl border border-belmont-border/80">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-belmont-text-muted">
            Carregando cotações reais do Supabase...
          </div>
        ) : candles.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-belmont-text-muted">
            Sem histórico de negociações para este timeframe.
          </div>
        ) : (
          candles.map((c, idx) => {
            const isGreen = c.close >= c.open
            const candleColor = isGreen ? 'bg-emerald-500 border-emerald-400' : 'bg-red-500 border-red-400'
            const wickColor = isGreen ? 'bg-emerald-400' : 'bg-red-400'

            const highPct = Math.min(100, Math.max(5, ((c.high - minPrice) / priceRange) * 100))
            const lowPct = Math.min(100, Math.max(0, ((c.low - minPrice) / priceRange) * 100))
            const openPct = Math.min(100, Math.max(5, ((c.open - minPrice) / priceRange) * 100))
            const closePct = Math.min(100, Math.max(5, ((c.close - minPrice) / priceRange) * 100))

            const bodyTop = Math.max(openPct, closePct)
            const bodyBottom = Math.min(openPct, closePct)
            const bodyHeight = Math.max(6, bodyTop - bodyBottom)

            return (
              <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end relative group">
                {/* Tooltip on Hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-2 bg-belmont-surface border border-belmont-border rounded-xl text-[10px] shadow-xl z-20 whitespace-nowrap">
                  <span className="font-bold text-belmont-text-primary">{c.time}</span>
                  <span className="text-emerald-400">Abertura: {c.open} Coins</span>
                  <span className="text-emerald-300">Máxima: {c.high} Coins</span>
                  <span className="text-red-400">Mínima: {c.low} Coins</span>
                  <span className="text-amber-300">Fechamento: {c.close} Coins</span>
                </div>

                {/* Wick High-Low line */}
                <div
                  className={`w-0.5 absolute ${wickColor}`}
                  style={{
                    bottom: `${lowPct}%`,
                    height: `${Math.max(2, highPct - lowPct)}%`,
                  }}
                />

                {/* Candle Body */}
                <div
                  className={`w-full max-w-[16px] rounded-sm ${candleColor} shadow-sm z-10`}
                  style={{
                    bottom: `${bodyBottom}%`,
                    height: `${bodyHeight}%`,
                    position: 'absolute',
                  }}
                />
              </div>
            )
          })
        )}
      </div>

      {/* Axis Price Limits */}
      <div className="flex items-center justify-between text-[10px] text-belmont-text-muted px-1 font-mono">
        <span>Mínima: {minPrice} Coins</span>
        <span>Máxima: {maxPrice} Coins</span>
      </div>
    </div>
  )
}
