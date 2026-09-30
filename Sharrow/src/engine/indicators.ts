import type { Candle } from '@/engine/types'

/* =========================================================================
   Technical indicators — pure functions, unit tested against known values.
   All series inputs are closes (or full candles where specified).
   ========================================================================= */

export function closes(candles: Candle[]): number[] {
  return candles.map((c) => c.c)
}

/** Simple moving average; null until enough data. */
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = []
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    out.push(i >= period - 1 ? sum / period : null)
  }
  return out
}

export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1]
}

export function lastSma(values: number[], period: number): number | null {
  const s = sma(values, period)
  return s[s.length - 1] ?? null
}

/** Exponential moving average (SMA seeded). */
export function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const out: number[] = []
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / Math.min(period, values.length)
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(values[i])
      continue
    }
    if (i === period - 1) {
      out.push(prev)
      continue
    }
    prev = values[i] * k + prev * (1 - k)
    out.push(prev)
  }
  return out
}

/** Wilder-style RSI. */
export function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1]
    if (d >= 0) gain += d
    else loss -= d
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/** Annualised volatility of simple returns over the window. */
export function volatility(values: number[], period = 20): number | null {
  if (values.length < period + 1) return null
  const window = values.slice(-(period + 1))
  const rets: number[] = []
  for (let i = 1; i < window.length; i++) rets.push(window[i] / window[i - 1] - 1)
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length
  return Math.sqrt(variance) * Math.sqrt(252)
}

/** Percentage change over `lookback` sessions. */
export function roc(values: number[], lookback: number): number | null {
  if (values.length <= lookback) return null
  const from = values[values.length - 1 - lookback]
  const to = values[values.length - 1]
  if (from === 0) return null
  return (to / from - 1) * 100
}

/** Z-score of the latest value against the trailing window. */
export function zscore(values: number[], period = 20): number | null {
  if (values.length < period) return null
  const window = values.slice(-period)
  const mean = window.reduce((a, b) => a + b, 0) / window.length
  const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length
  const sd = Math.sqrt(variance)
  if (sd === 0) return 0
  return (values[values.length - 1] - mean) / sd
}

/** Slope of the moving average in % per session — trend health. */
export function slopePct(values: number[], period = 20, span = 10): number | null {
  const s = sma(values, period)
  const tail = s.slice(-span).filter((v): v is number => v !== null)
  if (tail.length < 2) return null
  const first = tail[0]
  const lastVal = tail[tail.length - 1]
  if (first === 0) return null
  return (lastVal / first - 1) * 100
}

/** Largest peak-to-trough decline in the window. */
export function maxDrawdown(values: number[]): number {
  let peak = values[0] ?? 0
  let worst = 0
  for (const v of values) {
    if (v > peak) peak = v
    const dd = peak === 0 ? 0 : (v / peak - 1) * 100
    if (dd < worst) worst = dd
  }
  return worst
}

export function pctChange(from: number, to: number): number {
  if (from === 0) return 0
  return (to / from - 1) * 100
}
