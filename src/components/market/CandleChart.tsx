'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Activity, RefreshCw, ZoomIn, ZoomOut, RotateCcw, BarChart3, AlertCircle } from 'lucide-react'
import { getCandlesService, Candle } from '@/lib/services/market'

interface CandleChartProps {
  assetId: string
  currentPrice: number
  assetSymbol?: string
}

export const CandleChart: React.FC<CandleChartProps> = ({ assetId, currentPrice, assetSymbol = 'BELMONT' }) => {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('1m')
  const [candles, setCandles] = useState<Candle[]>([])
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number; price: number } | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(1) // 1 = default, higher = zoomed in
  const [panOffset, setPanOffset] = useState<number>(0) // 0 = latest, positive = past candles
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStartX, setDragStartX] = useState<number>(0)

  const containerRef = useRef<HTMLDivElement>(null)

  const fetchCandles = useCallback(async () => {
    setIsLoading(true)
    const data = await getCandlesService(assetId, timeframe, currentPrice)
    setCandles(data)
    if (data.length > 0) {
      setHoveredCandle(data[data.length - 1])
    } else {
      setHoveredCandle(null)
    }
    setIsLoading(false)
  }, [assetId, timeframe, currentPrice])

  useEffect(() => {
    fetchCandles()
    // 8-second Polling Cycle
    const intervalId = setInterval(fetchCandles, 8000)
    return () => clearInterval(intervalId)
  }, [fetchCandles])

  // Reset Zoom/Pan on asset or timeframe change
  useEffect(() => {
    setZoomLevel(1)
    setPanOffset(0)
  }, [assetId, timeframe])

  // Visible Candles calculation based on Zoom & Pan
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return []

    const baseCount = Math.max(10, Math.floor(candles.length / zoomLevel))
    const maxOffset = Math.max(0, candles.length - baseCount)
    const clampedOffset = Math.min(maxOffset, Math.max(0, panOffset))

    const startIndex = Math.max(0, candles.length - baseCount - clampedOffset)
    const endIndex = Math.min(candles.length, startIndex + baseCount)

    return candles.slice(startIndex, endIndex)
  }, [candles, zoomLevel, panOffset])

  // Dynamic Y-Axis Scale Bounds based on visible candles
  const { minPrice, maxPrice, priceRange, maxVolume } = useMemo(() => {
    if (visibleCandles.length === 0) {
      const p = currentPrice || 100
      return { minPrice: p - 5, maxPrice: p + 5, priceRange: 10, maxVolume: 100 }
    }

    const highs = visibleCandles.map((c) => c.high)
    const lows = visibleCandles.map((c) => c.low)
    const volumes = visibleCandles.map((c) => c.volume)

    let maxP = Math.max(...highs, currentPrice)
    let minP = Math.min(...lows, currentPrice)

    // Add 5% padding to avoid candle touching top/bottom border
    const padding = Math.max(2, Math.round((maxP - minP) * 0.08))
    maxP += padding
    minP = Math.max(1, minP - padding)

    const range = Math.max(1, maxP - minP)
    const maxVol = Math.max(...volumes, 10)

    return { minPrice: minP, maxPrice: maxP, priceRange: range, maxVolume: maxVol }
  }, [visibleCandles, currentPrice])

  // Price Grid Levels
  const gridLevels = useMemo(() => {
    return [
      maxPrice,
      Math.round(minPrice + priceRange * 0.75),
      Math.round(minPrice + priceRange * 0.5),
      Math.round(minPrice + priceRange * 0.25),
      minPrice,
    ]
  }, [maxPrice, minPrice, priceRange])

  // Active Candle for Financial Tooltip Banner
  const activeCandle = hoveredCandle || visibleCandles[visibleCandles.length - 1] || null
  const isBullish = activeCandle ? activeCandle.close >= activeCandle.open : true

  // Mouse Interaction: Crosshair & Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || visibleCandles.length === 0) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Chart dimensions excluding right Y-axis strip (width - 60px) and bottom timestamp bar (height - 24px)
    const chartWidth = rect.width - 60
    const chartHeight = rect.height - 24

    if (mouseX < 0 || mouseX > chartWidth || mouseY < 0 || mouseY > chartHeight) {
      setHoverPos(null)
      return
    }

    // Calculate Price at Mouse Y
    const priceRatio = 1 - mouseY / chartHeight
    const calculatedPrice = Math.round(minPrice + priceRatio * priceRange)

    // Find closest Candle at Mouse X
    const candleWidth = chartWidth / visibleCandles.length
    const index = Math.min(visibleCandles.length - 1, Math.max(0, Math.floor(mouseX / candleWidth)))
    const candle = visibleCandles[index]

    if (candle) {
      setHoveredCandle(candle)
      setHoverPos({
        x: (index + 0.5) * candleWidth,
        y: mouseY,
        price: calculatedPrice,
      })
    }

    // Handle Drag for Pan
    if (isDragging) {
      const deltaX = mouseX - dragStartX
      if (Math.abs(deltaX) > 10) {
        const offsetChange = Math.round(deltaX / candleWidth)
        setPanOffset((prev) => Math.max(0, prev + offsetChange))
        setDragStartX(mouseX)
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setIsDragging(true)
    setDragStartX(e.clientX - rect.left)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoverPos(null)
    if (visibleCandles.length > 0) {
      setHoveredCandle(visibleCandles[visibleCandles.length - 1])
    }
  }

  // Wheel Handler for Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      // Zoom In
      setZoomLevel((prev) => Math.min(4, Number((prev + 0.15).toFixed(2))))
    } else {
      // Zoom Out
      setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.15).toFixed(2))))
    }
  }

  const handleReset = () => {
    setZoomLevel(1)
    setPanOffset(0)
    setHoverPos(null)
    if (candles.length > 0) {
      setHoveredCandle(candles[candles.length - 1])
    }
  }

  // Position of Last Price horizontal line in Y percentage
  const lastPriceYPct = Math.min(98, Math.max(2, ((maxPrice - currentPrice) / priceRange) * 100))

  return (
    <div className="glass-panel p-5 rounded-3xl border border-belmont-border space-y-4 font-sans select-none relative bg-slate-950/60">
      {/* Financial Header & Overlay Bar (Requirement 3 & 7) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-belmont-border">
        {/* TradingView Notation: O H L C VOL */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 pr-2 border-r border-belmont-border/60">
            <span className="font-bold text-belmont-text-primary">{assetSymbol}</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
              <Activity className="w-3 h-3 animate-pulse" /> LIVE
            </span>
          </div>

          {activeCandle ? (
            <div className="flex items-center gap-3.5 text-[11px]">
              <span>O: <strong className="text-belmont-text-primary">{activeCandle.open.toFixed(2)}</strong></span>
              <span>H: <strong className="text-emerald-400">{activeCandle.high.toFixed(2)}</strong></span>
              <span>L: <strong className="text-red-400">{activeCandle.low.toFixed(2)}</strong></span>
              <span>C: <strong className={isBullish ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{activeCandle.close.toFixed(2)}</strong></span>
              <span>VOL: <strong className="text-amber-300">{activeCandle.volume}</strong></span>
              <span className="text-belmont-text-muted">({activeCandle.time})</span>
            </div>
          ) : (
            <span className="text-belmont-text-muted text-xs">Sem dados de candles</span>
          )}
        </div>

        {/* Timeframe & Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-belmont-surface/80 rounded-xl border border-belmont-border text-xs">
            {(['1m', '5m', '15m', '1h', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timeframe === tf ? 'bg-belmont-crimson text-white shadow-belmont-glow' : 'text-belmont-text-muted hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((prev) => Math.min(4, prev + 0.2))}
              className="p-1.5 rounded-lg bg-belmont-surface/60 border border-belmont-border text-belmont-text-muted hover:text-white hover:border-belmont-rose/40"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.2))}
              className="p-1.5 rounded-lg bg-belmont-surface/60 border border-belmont-border text-belmont-text-muted hover:text-white hover:border-belmont-rose/40"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-belmont-surface/60 border border-belmont-border text-belmont-text-muted hover:text-white hover:border-belmont-rose/40"
              title="Resetar Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchCandles}
              className="p-1.5 rounded-lg bg-belmont-surface/60 border border-belmont-border text-belmont-text-muted hover:text-white hover:border-belmont-rose/40"
              title="Atualizar Dados"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main TradingView Canvas Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className="relative w-full h-80 bg-slate-950/80 rounded-2xl border border-belmont-border/80 overflow-hidden flex cursor-crosshair"
      >
        {/* Left Side: Candlesticks & Volume Sub-chart Area */}
        <div className="flex-1 h-full relative flex items-end justify-between pr-1">
          {/* Background Horizontal Gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
            {gridLevels.map((_, i) => (
              <div key={i} className="w-full border-b border-dashed border-belmont-text-muted" />
            ))}
          </div>

          {/* Requirement 5: Last Price Line */}
          {currentPrice > 0 && (
            <div
              className="absolute left-0 right-0 border-b border-dashed border-amber-400/90 pointer-events-none z-10 flex items-center justify-end"
              style={{ top: `${lastPriceYPct}%` }}
            >
              <span className="bg-amber-400 text-slate-950 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-l-md shadow-md mr-[-1px]">
                {currentPrice.toFixed(2)}
              </span>
            </div>
          )}

          {/* Requirement 4: Crosshair Lines */}
          {hoverPos && (
            <>
              {/* Vertical Crosshair Line */}
              <div
                className="absolute top-0 bottom-0 w-[1px] bg-belmont-text-muted/60 border-r border-dashed border-white/50 pointer-events-none z-20"
                style={{ left: `${hoverPos.x}px` }}
              />
              {/* Horizontal Crosshair Line */}
              <div
                className="absolute left-0 right-0 height-[1px] bg-belmont-text-muted/60 border-b border-dashed border-white/50 pointer-events-none z-20"
                style={{ top: `${hoverPos.y}px` }}
              />
              {/* Floating Price Badge on Y-axis cursor */}
              <div
                className="absolute right-0 bg-belmont-rose text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-l-md pointer-events-none z-30"
                style={{ top: `${Math.max(4, Math.min(270, hoverPos.y - 10))}px` }}
              >
                {hoverPos.price.toFixed(2)}
              </div>
            </>
          )}

          {/* Render Candles & Volume Sub-chart */}
          {isLoading && visibleCandles.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-belmont-text-muted gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-belmont-rose" />
              <span>Sincronizando candles do mercado...</span>
            </div>
          ) : visibleCandles.length === 0 ? (
            /* Requirement 12: Insufficient Data Banner */
            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-belmont-text-muted gap-2 p-6 text-center">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <p className="font-bold text-belmont-text-primary">Dados insuficientes para este período.</p>
              <p className="text-[11px] max-w-sm">Ainda não foram registrados trades suficientes no timeframe de {timeframe}. Selecione outro timeframe ou aguarde o próximo ciclo do engine.</p>
            </div>
          ) : (
            visibleCandles.map((c, idx) => {
              const candleIsBullish = c.close >= c.open

              // Calculate Body & Wick Vertical Percentages
              const highPct = Math.min(96, Math.max(4, ((maxPrice - c.high) / priceRange) * 78))
              const lowPct = Math.min(96, Math.max(4, ((maxPrice - c.low) / priceRange) * 78))
              const openPct = Math.min(96, Math.max(4, ((maxPrice - c.open) / priceRange) * 78))
              const closePct = Math.min(96, Math.max(4, ((maxPrice - c.close) / priceRange) * 78))

              const bodyTop = Math.min(openPct, closePct)
              const bodyBottom = Math.max(openPct, closePct)
              const bodyHeight = Math.max(3, bodyBottom - bodyTop)

              // Requirement 8: Volume sub-chart occupying ~22% height at bottom
              const volumeHeightPct = Math.min(22, Math.max(3, (c.volume / maxVolume) * 20))

              return (
                <div
                  key={idx}
                  className="flex-1 h-full flex flex-col items-center justify-end relative group px-[1px]"
                >
                  {/* Volume Sub-chart Bar (Bottom 22%) */}
                  <div
                    className={`w-full max-w-[14px] rounded-t-xs opacity-40 transition-all ${
                      candleIsBullish ? 'bg-emerald-500 hover:opacity-80' : 'bg-red-500 hover:opacity-80'
                    }`}
                    style={{ height: `${volumeHeightPct}%` }}
                    title={`Volume: ${c.volume}`}
                  />

                  {/* Candle Wick (High to Low) */}
                  <div
                    className={`w-[1.5px] absolute pointer-events-none ${candleIsBullish ? 'bg-emerald-400' : 'bg-red-400'}`}
                    style={{
                      top: `${highPct}%`,
                      height: `${Math.max(2, lowPct - highPct)}%`,
                    }}
                  />

                  {/* Candle Body Rect */}
                  <div
                    className={`w-full max-w-[12px] rounded-xs border transition-all pointer-events-none ${
                      candleIsBullish
                        ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                        : 'bg-red-500 border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.3)]'
                    }`}
                    style={{
                      top: `${bodyTop}%`,
                      height: `${bodyHeight}%`,
                      position: 'absolute',
                    }}
                  />
                </div>
              )
            })
          )}
        </div>

        {/* Right Side Y-Axis Price Column */}
        <div className="w-16 h-full border-l border-belmont-border/80 flex flex-col justify-between py-3 px-1.5 bg-slate-900/90 text-[10px] font-mono text-belmont-text-muted text-right">
          {gridLevels.map((lvl, idx) => (
            <span key={idx} className="leading-none">{lvl.toFixed(1)}</span>
          ))}
        </div>
      </div>

      {/* Bottom X-Axis Time Bar & Controls Summary */}
      <div className="flex items-center justify-between text-[10px] font-mono text-belmont-text-muted px-2 pt-1 border-t border-belmont-border/40">
        <span>{visibleCandles[0]?.time || '—'}</span>
        <span className="text-[11px] text-amber-300 font-semibold">
          Zoom: {zoomLevel.toFixed(1)}x {panOffset > 0 && `• Offset: -${panOffset}`}
        </span>
        <span className="text-emerald-400 font-bold">{visibleCandles[visibleCandles.length - 1]?.time || '—'}</span>
      </div>
    </div>
  )
}
