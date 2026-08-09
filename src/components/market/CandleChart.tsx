'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  ColorType,
  CrosshairMode,
  LineStyle,
  UTCTimestamp,
} from 'lightweight-charts'
import { RefreshCw, RotateCcw, Activity, AlertCircle } from 'lucide-react'
import { getCandlesService, CandleOHLCV } from '@/lib/services/market'

interface CandleChartProps {
  assetId: string
  currentPrice: number
  assetSymbol?: string
  change24h?: number
}

export const CandleChart: React.FC<CandleChartProps> = ({
  assetId,
  currentPrice,
  assetSymbol = 'BELMONT',
  change24h = 0,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<any> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null)
  const priceLineRef = useRef<any>(null)

  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('1m')
  const [candles, setCandles] = useState<CandleOHLCV[]>([])
  const [hoveredCandle, setHoveredCandle] = useState<CandleOHLCV | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Reset candle state on asset switch to avoid rendering previous asset data
  useEffect(() => {
    setCandles([])
    setHoveredCandle(null)
    setIsLoading(true)
  }, [assetId, timeframe])

  // Fetch real aggregated candles
  const fetchCandles = useCallback(async () => {
    try {
      const data = await getCandlesService(assetId, timeframe)
      setCandles(data)
    } catch (e) {
      setCandles([])
    } finally {
      setIsLoading(false)
    }
  }, [assetId, timeframe])

  useEffect(() => {
    fetchCandles()
    // 6-second Polling Cycle
    const intervalId = setInterval(fetchCandles, 6000)
    return () => clearInterval(intervalId)
  }, [fetchCandles])

  // Initialize TradingView Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current) return

    const container = chartContainerRef.current
    container.innerHTML = '' // Clean previous instances completely

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94A3B8',
        fontFamily: 'Consolas, Monaco, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(244, 63, 94, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1E293B',
        },
        horzLine: {
          color: 'rgba(244, 63, 94, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1E293B',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        autoScale: true,
        scaleMargins: {
          top: 0.12,
          bottom: 0.28,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 14,
        minBarSpacing: 4,
        rightOffset: 6,
      },
    })

    chartRef.current = chart

    // Add Candlestick Series matching reference image aesthetics (Vibrant Green & Pure Red)
    const candlestickSeries = (chart as any).addCandlestickSeries
      ? (chart as any).addCandlestickSeries({
          upColor: '#00C853',
          downColor: '#FF1744',
          borderVisible: true,
          borderUpColor: '#00C853',
          borderDownColor: '#FF1744',
          wickUpColor: '#00C853',
          wickDownColor: '#FF1744',
        })
      : chart.addSeries(CandlestickSeries, {
          upColor: '#00C853',
          downColor: '#FF1744',
          borderVisible: true,
          borderUpColor: '#00C853',
          borderDownColor: '#FF1744',
          wickUpColor: '#00C853',
          wickDownColor: '#FF1744',
        })

    candlestickSeriesRef.current = candlestickSeries

    // Add Volume Histogram Series with separate priceScaleId 'volume' (hidden scale)
    const volumeSeries = (chart as any).addHistogramSeries
      ? (chart as any).addHistogramSeries({
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        })
      : chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        })

    if (volumeSeries.priceScale) {
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
        visible: false,
      })
    }

    volumeSeriesRef.current = volumeSeries

    // Subscribe Crosshair Movement to Update Header OHLC
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData || param.point === undefined || param.point.x < 0 || param.point.y < 0) {
        setHoveredCandle(null)
        return
      }

      const data = param.seriesData.get(candlestickSeries) as any
      if (data && data.open !== undefined) {
        const volumeData = param.seriesData.get(volumeSeries) as any
        const d = new Date((param.time as number) * 1000)
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

        setHoveredCandle({
          time: param.time as number,
          timeStr,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: volumeData ? (volumeData.value || 0) : 0,
        })
      } else {
        setHoveredCandle(null)
      }
    })

    const handleResize = () => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    // Clean cleanup function on asset switch or unmount
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        try {
          chartRef.current.remove()
        } catch (e) {}
      }
      chartRef.current = null
      candlestickSeriesRef.current = null
      volumeSeriesRef.current = null
      priceLineRef.current = null
    }
  }, [assetId])

  // Update Series Data safely on Candles Refresh
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return

    const formattedCandles = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    const formattedVolume = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(0, 200, 83, 0.35)' : 'rgba(255, 23, 68, 0.35)',
    }))

    try {
      candlestickSeriesRef.current.setData(formattedCandles)
      volumeSeriesRef.current.setData(formattedVolume)

      // Manage SINGLE Last Price Line safely
      if (candlestickSeriesRef.current) {
        if (priceLineRef.current && candlestickSeriesRef.current.removePriceLine) {
          try {
            candlestickSeriesRef.current.removePriceLine(priceLineRef.current)
          } catch (e) {}
        }

        if (currentPrice > 0 && candlestickSeriesRef.current.createPriceLine) {
          priceLineRef.current = candlestickSeriesRef.current.createPriceLine({
            price: currentPrice,
            color: '#F59E0B',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '',
          })
        }
      }

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    } catch (e) {
      // Ignore transient race condition updates during asset transition
    }
  }, [candles, currentPrice])

  // Active Candle for Financial Header Display (Defaults to latest candle if mouse outside)
  const activeCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null)
  const isBullish = activeCandle ? activeCandle.close >= activeCandle.open : true
  const isPositiveChange = change24h >= 0

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }

  return (
    <div className="glass-panel p-5 rounded-3xl border border-belmont-border space-y-3 font-sans select-none relative bg-slate-950/70">
      {/* Financial Terminal Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-belmont-border/80">
        {/* Symbol, Price, 24h Change & Live Badge */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-display font-extrabold text-base text-belmont-text-primary tracking-wide">
              {assetSymbol}
            </span>
            <span className="text-xl font-extrabold text-amber-300 font-display">
              {currentPrice.toFixed(2)} Coins
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isPositiveChange ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {isPositiveChange ? `+${change24h}%` : `${change24h}%`}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold ml-1">
              <Activity className="w-3 h-3 animate-pulse" /> LIVE
            </span>
          </div>

          {/* Strict Financial Notation: O H L C VOL */}
          {activeCandle ? (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-belmont-text-secondary pt-0.5">
              <span>O <strong className="text-belmont-text-primary">{activeCandle.open.toFixed(2)}</strong></span>
              <span>H <strong className="text-emerald-400">{activeCandle.high.toFixed(2)}</strong></span>
              <span>L <strong className="text-red-400">{activeCandle.low.toFixed(2)}</strong></span>
              <span>C <strong className={isBullish ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{activeCandle.close.toFixed(2)}</strong></span>
              <span>VOL <strong className="text-amber-300">{activeCandle.volume.toLocaleString('pt-BR')}</strong></span>
              <span className="text-belmont-text-muted text-[11px]">({activeCandle.timeStr})</span>
            </div>
          ) : (
            <span className="text-xs text-belmont-text-muted">Aguardando dados de candles...</span>
          )}
        </div>

        {/* Timeframe Buttons & Discrete Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-belmont-surface/80 rounded-xl border border-belmont-border text-xs font-mono">
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
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg bg-belmont-surface/60 border border-belmont-border text-belmont-text-muted hover:text-white hover:border-belmont-rose/40 transition-colors"
              title="Resetar Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchCandles}
              className="p-1.5 rounded-lg bg-belmont-surface/60 border border-belmont-border text-belmont-text-muted hover:text-white hover:border-belmont-rose/40 transition-colors"
              title="Atualizar Dados"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Lightweight Charts Container */}
      <div className="relative w-full h-[380px]">
        {isLoading && candles.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 rounded-2xl text-xs text-belmont-text-muted gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-belmont-rose" />
            <span>Sincronizando gráfico...</span>
          </div>
        )}

        {!isLoading && candles.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-6 text-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-400" />
            <p className="font-bold text-belmont-text-primary text-xs">Dados insuficientes para este período.</p>
            <p className="text-[11px] text-belmont-text-muted max-w-sm">
              Não foram registrados trades no timeframe de {timeframe}. Selecione outro timeframe ou aguarde o próximo ciclo do engine.
            </p>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-full rounded-2xl overflow-hidden" />
      </div>
    </div>
  )
}
