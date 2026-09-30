import type { Candle, Timeframe } from '@/engine/types'
import { TIMEFRAME_DAYS, getDailySeries, getIntraday, withLiveTail } from '@/services/market-data'

/** Shared, pure helpers for the asset detail screen. */

export const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y']

/** Candles for a chart timeframe, with today's live tick applied to the tail. */
export function chartCandles(symbol: string, timeframe: Timeframe): Candle[] {
  if (timeframe === '1D') return withLiveTail(symbol, getIntraday(symbol))
  const days = TIMEFRAME_DAYS[timeframe]
  return withLiveTail(symbol, getDailySeries(symbol)).slice(-days)
}

export interface PeriodStats {
  first: number
  last: number
  changePct: number
  high: number
  low: number
  maxVolume: number
}

export function periodStats(candles: Candle[]): PeriodStats | null {
  if (candles.length === 0) return null
  const closes = candles.map((c) => c.c)
  const first = closes[0]
  const last = closes[closes.length - 1]
  return {
    first,
    last,
    changePct: first > 0 ? ((last - first) / first) * 100 : 0,
    high: Math.max(...candles.map((c) => c.h)),
    low: Math.min(...candles.map((c) => c.l)),
    maxVolume: Math.max(...candles.map((c) => c.v)),
  }
}

/** Session open from the intraday series (first 5-minute bar). */
export function sessionOpen(symbol: string): number | null {
  const bars = getIntraday(symbol)
  return bars.length > 0 ? bars[0].o : null
}

/** 52-week (250-session) high/low derived from the simulated daily series. */
export function yearRange(symbol: string): { high: number; low: number } | null {
  const candles = getDailySeries(symbol).slice(-250)
  if (candles.length === 0) return null
  return {
    high: Math.max(...candles.map((c) => c.h)),
    low: Math.min(...candles.map((c) => c.l)),
  }
}
