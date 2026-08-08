'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Candle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  count: number
}

interface CandleChartProps {
  assetId: string
  currentPrice: number
}

export const CandleChart: React.FC<CandleChartProps> = ({ assetId, currentPrice }) => {
  const supabase = createClient()
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('1m')
  const [candles, setCandles] = useState<Candle[]>([])
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null)
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
          .limit(300)

        const logs = priceLogs || []

        if (logs.length === 0) {
          const fallbackCandle: Candle = {
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            open: currentPrice,
            high: currentPrice + 1,
            low: Math.max(1, currentPrice - 1),
            close: currentPrice,
            volume: 10,
            count: 1,
          }
          setCandles([fallbackCandle])
          setHoveredCandle(fallbackCandle)
          setIsLoading(false)
          return
        }

        // Group actual logs into distinct time-bucket candles
        const groupedMap = new Map<string, any[]>()

        for (const log of logs) {
          const d = new Date(log.created_at)
          let key: string

          if (timeframe === '1m') {
            const minStr = String(d.getMinutes()).padStart(2, '0')
            key = `${d.getHours()}:${minStr}`
          } else if (timeframe === '5m') {
            const min = Math.floor(d.getMinutes() / 5) * 5
            const minStr = String(min).padStart(2, '0')
            key = `${d.getHours()}:${minStr}`
          } else if (timeframe === '15m') {
            const min = Math.floor(d.getMinutes() / 15) * 15
            const minStr = String(min).padStart(2, '0')
            key = `${d.getHours()}:${minStr}`
          } else if (timeframe === '1h') {
            key = `${d.getHours()}:00`
          } else {
            key = `${d.getDate()}/${d.getMonth() + 1}`
          }

          if (!groupedMap.has(key)) {
            groupedMap.set(key, [])
          }
          groupedMap.get(key)!.push(log)
        }

        const realCandles: Candle[] = []
        for (const [timeKey, bucketLogs] of groupedMap.entries()) {
          const prices = bucketLogs.map((l) => l.price)
          const open = prices[0]
          const close = prices[prices.length - 1]
          const high = Math.max(...prices)
          const low = Math.min(...prices)
          const volume = bucketLogs.reduce((sum, l) => sum + (l.volume || 1), 0)

          realCandles.push({
            time: timeKey,
            open,
            high,
            low,
            close,
            volume,
            count: bucketLogs.length,
          })
        }

        // Keep last 20 real candles
        const finalCandles = realCandles.slice(-20)
        setCandles(finalCandles)
        setHoveredCandle(finalCandles[finalCandles.length - 1] || null)
      } catch (e) {
        setCandles([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRealCandles()

    // 10s Polling Loop
    const intervalId = setInterval(fetchRealCandles, 10000)
    return () => clearInterval(intervalId)
  }, [assetId, timeframe, currentPrice])

  const maxPrice = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) + 1 : currentPrice + 3
  const minPrice = candles.length > 0 ? Math.max(1, Math.min(...candles.map((c) => c.low)) - 1) : Math.max(1, currentPrice - 3)
  const priceRange = Math.max(1, maxPrice - minPrice)

  const maxVolume = candles.length > 0 ? Math.max(...candles.map((c) => c.volume), 10) : 100

  // Price Grid Levels
  const gridLevels = [
    maxPrice,
    Math.round(minPrice + (priceRange * 0.75)),
    Math.round(minPrice + (priceRange * 0.5)),
    Math.round(minPrice + (priceRange * 0.25)),
    minPrice,
  ]

  const displayCandle = hoveredCandle || candles[candles.length - 1] || {
    open: currentPrice,
    high: currentPrice,
    low: currentPrice,
    close: currentPrice,
    volume: 0,
    time: '—',
  }

  const isBullish = displayCandle.close >= displayCandle.open

  return (
    <div className="glass-panel p-5 rounded-3xl border border-belmont-border space-y-4 font-sans select-none">
      {/* Top Header & Overlay Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-belmont-border">
        {/* Live Candle Data Overlay */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-belmont-text-primary font-bold">{displayCandle.time}</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
              <Activity className="w-3 h-3 animate-pulse" /> ● AO VIVO
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>A: <strong className="text-belmont-text-primary">{displayCandle.open}</strong></span>
            <span>M: <strong className="text-emerald-400">{displayCandle.high}</strong></span>
            <span>m: <strong className="text-red-400">{displayCandle.low}</strong></span>
            <span>F: <strong className={isBullish ? 'text-emerald-400' : 'text-red-400'}>{displayCandle.close}</strong></span>
            <span>Vol: <strong className="text-amber-300">{displayCandle.volume}</strong></span>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 p-1 bg-belmont-surface/80 rounded-xl border border-belmont-border text-xs">
          {(['1m', '5m', '15m', '1h', '1D'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                timeframe === tf ? 'bg-belmont-crimson text-white shadow-sm' : 'text-belmont-text-muted hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="relative w-full h-64 sm:h-72 bg-belmont-bg/80 rounded-2xl border border-belmont-border overflow-hidden flex">
        {/* Left Side: Candlestick & Volume Area */}
        <div className="flex-1 h-full relative flex items-end justify-around px-3 pt-6 pb-6">
          {/* Background Horizontal Gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
            {gridLevels.map((_, i) => (
              <div key={i} className="w-full border-b border-dashed border-belmont-text-muted" />
            ))}
          </div>

          {/* Render Candles */}
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-belmont-text-muted">
              Sincronizando cotações reais do Supabase...
            </div>
          ) : (
            candles.map((c, idx) => {
              const candleIsBullish = c.close >= c.open

              // Calculate Percentages
              const highPct = Math.min(95, Math.max(5, ((c.high - minPrice) / priceRange) * 80))
              const lowPct = Math.min(95, Math.max(2, ((c.low - minPrice) / priceRange) * 80))
              const openPct = Math.min(95, Math.max(5, ((c.open - minPrice) / priceRange) * 80))
              const closePct = Math.min(95, Math.max(5, ((c.close - minPrice) / priceRange) * 80))

              const bodyTop = Math.max(openPct, closePct)
              const bodyBottom = Math.min(openPct, closePct)
              const bodyHeight = Math.max(8, bodyTop - bodyBottom)

              const volumeHeight = Math.min(25, Math.max(4, (c.volume / maxVolume) * 22))

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredCandle(c)}
                  className="flex-1 h-full flex flex-col items-center justify-end relative group cursor-pointer px-1"
                >
                  {/* Volume Bar (Bottom Sub-chart) */}
                  <div
                    className={`w-full max-w-[12px] rounded-t-sm opacity-35 ${candleIsBullish ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ height: `${volumeHeight}%` }}
                  />

                  {/* Wick Line (High to Low) */}
                  <div
                    className={`w-[1.5px] absolute ${candleIsBullish ? 'bg-emerald-400' : 'bg-red-400'}`}
                    style={{
                      bottom: `${lowPct + 15}%`,
                      height: `${Math.max(4, highPct - lowPct)}%`,
                    }}
                  />

                  {/* Body Rect */}
                  <div
                    className={`w-full max-w-[14px] rounded-xs border ${
                      candleIsBullish
                        ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                    }`}
                    style={{
                      bottom: `${bodyBottom + 15}%`,
                      height: `${bodyHeight}%`,
                      position: 'absolute',
                    }}
                  />
                </div>
              )
            })
          )}
        </div>

        {/* Right Side: Y-Axis Price Labels */}
        <div className="w-14 h-full border-l border-belmont-border/80 flex flex-col justify-between py-5 px-1 bg-belmont-surface/40 text-[10px] font-mono text-belmont-text-muted text-right">
          {gridLevels.map((lvl, idx) => (
            <span key={idx}>{lvl}</span>
          ))}
        </div>
      </div>

      {/* Bottom X-Axis Time Ticks */}
      <div className="flex items-center justify-between text-[10px] font-mono text-belmont-text-muted px-2">
        <span>{candles[0]?.time || '—'}</span>
        <span>{candles[Math.floor(candles.length / 2)]?.time || '—'}</span>
        <span className="text-emerald-400 font-bold">{candles[candles.length - 1]?.time || '—'}</span>
      </div>
    </div>
  )
}
