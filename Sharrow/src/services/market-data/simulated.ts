import type { Candle, Timeframe } from '@/engine/types'
import { BASE_PRICE, ASSET_BY_SYMBOL } from '@/data/universe'
import { gaussian, hashString, mulberry32 } from '@/lib/rng'

export { hashString, mulberry32, gaussian } from '@/lib/rng'

/* =========================================================================
   Deterministic simulated price generation.
   A shared market factor produces correlated moves; each symbol adds its own
   beta and idiosyncratic noise. The generated path is normalised so that the
   final close equals the fixture base price.
   ========================================================================= */

const DAY = 86_400_000
const SESSION_MS = 375 * 60_000 // 09:15 → 15:30

export const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  '1D': 1,
  '1W': 5,
  '1M': 22,
  '3M': 64,
  '6M': 128,
  '1Y': 252,
  '5Y': 1260,
}

const TOTAL_DAYS = TIMEFRAME_DAYS['5Y']

/* ------------------------------- RNG ---------------------------------- */
/* hashString / mulberry32 / gaussian are shared from @/lib/rng. */

/* -------------------------- Shared market factor ------------------------ */

interface RegimeSegment {
  days: number
  drift: number
  vol: number
}

/** Long-run structure so charts show recognisable regimes, not pure noise. */
const REGIME_PATH: RegimeSegment[] = [
  { days: 260, drift: 0.0009, vol: 0.0095 },
  { days: 150, drift: -0.0006, vol: 0.0135 },
  { days: 210, drift: 0.0011, vol: 0.0085 },
  { days: 120, drift: 0.0002, vol: 0.0165 },
  { days: 240, drift: 0.001, vol: 0.008 },
  { days: 130, drift: -0.0004, vol: 0.012 },
  { days: 150, drift: 0.0008, vol: 0.009 },
]

let marketFactor: number[] | null = null

function getMarketFactor(): number[] {
  if (marketFactor) return marketFactor
  const rng = mulberry32(0x53484152) // "SHAR"
  const out: number[] = []
  for (const seg of REGIME_PATH) {
    for (let i = 0; i < seg.days; i++) {
      out.push(seg.drift + gaussian(rng) * seg.vol)
    }
  }
  // Trim/pad to the required history length.
  while (out.length < TOTAL_DAYS) out.push(0.0004 + gaussian(rng) * 0.009)
  marketFactor = out.slice(0, TOTAL_DAYS)
  return marketFactor
}

const betaBySector: Record<string, number> = {
  it: 1.15,
  banks: 1.2,
  fmcg: 0.6,
  auto: 1.3,
  pharma: 0.75,
  energy: 1.1,
  metals: 1.55,
  infra: 1.25,
}

/** Market beta for a symbol — shared by the series generator and the quote session. */
export function betaFor(symbol: string): number {
  const asset = ASSET_BY_SYMBOL[symbol]
  if (asset?.kind === 'index') return 0.85
  return betaBySector[asset?.sector ?? 'infra'] ?? 1
}

/* ------------------------------ Daily series ---------------------------- */

const dailyCache = new Map<string, Candle[]>()

function tradingDays(count: number, endDate = new Date()): number[] {
  const days: number[] = []
  const d = new Date(endDate)
  d.setHours(15, 30, 0, 0)
  while (days.length < count) {
    const weekday = d.getDay()
    if (weekday !== 0 && weekday !== 6) days.push(d.getTime())
    d.setTime(d.getTime() - DAY)
  }
  return days.reverse()
}

export function getDailySeries(symbol: string): Candle[] {
  const cached = dailyCache.get(symbol)
  if (cached) return cached

  const asset = ASSET_BY_SYMBOL[symbol]
  const base = BASE_PRICE[symbol] ?? 100
  const factor = getMarketFactor()
  const rng = mulberry32(hashString(symbol))
  const isIndex = asset?.kind === 'index'
  const beta = isIndex ? 0.85 : betaBySector[asset?.sector ?? 'infra'] ?? 1

  // Indexes blend the factor with a sector mix; equities add idio noise.
  const idioVol = isIndex ? 0.0015 : 0.006
  const returns: number[] = []
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const r = factor[i] * beta + gaussian(rng) * idioVol
    returns.push(r)
  }

  // Cumulative path, normalised so the last close equals the base price.
  const path: number[] = []
  let acc = 1
  for (let i = 0; i < TOTAL_DAYS; i++) {
    acc *= 1 + returns[i]
    path.push(acc)
  }
  const last = path[path.length - 1]

  const dates = tradingDays(TOTAL_DAYS)
  const candles: Candle[] = []
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const close = (base * path[i]) / last
    const prev = i === 0 ? close * (1 - returns[i]) : (base * path[i - 1]) / last
    const spread = Math.abs(close - prev) * 0.6 + close * 0.0015
    const open = prev + (rng() - 0.5) * spread * 0.5
    const high = Math.max(open, close) + rng() * spread
    const low = Math.min(open, close) - rng() * spread
    const volume = Math.round(
      (isIndex ? 0 : 1_000_000) * (0.5 + rng()) * (1 + Math.abs(returns[i]) * 45),
    )
    candles.push({
      t: dates[i],
      o: round2(open),
      h: round2(high),
      l: round2(low),
      c: round2(close),
      v: volume,
    })
  }

  dailyCache.set(symbol, candles)
  return candles
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/* ------------------------------- Intraday ------------------------------ */

const intradayCache = new Map<string, Candle[]>()

export function getIntraday(symbol: string): Candle[] {
  const cached = intradayCache.get(symbol)
  if (cached) return cached

  const daily = getDailySeries(symbol)
  const last = daily[daily.length - 1]
  const prev = daily[daily.length - 2] ?? last
  const rng = mulberry32(hashString(`${symbol}-intraday`))

  const barCount = 75 // 5-minute bars
  const gap = (last.o - prev.c) / prev.c
  const targetMove = (last.c - last.o) / last.o
  const step = targetMove / barCount

  const sessionStart = last.t - SESSION_MS
  const bars: Candle[] = []
  let price = last.o

  for (let i = 0; i < barCount; i++) {
    const open = price
    const drift = step + gaussian(rng) * 0.0009 + gap * 0.0002
    const close = open * (1 + drift)
    const high = Math.max(open, close) * (1 + Math.abs(gaussian(rng)) * 0.0004)
    const low = Math.min(open, close) * (1 - Math.abs(gaussian(rng)) * 0.0004)
    const volume = Math.round(60_000 * (0.4 + rng() * 1.6) * (i < 8 || i > 66 ? 2.2 : 1))
    bars.push({
      t: sessionStart + i * 5 * 60_000,
      o: round2(open),
      h: round2(high),
      l: round2(low),
      c: round2(close),
      v: volume,
    })
    price = close
  }

  intradayCache.set(symbol, bars)
  return bars
}

export function sessionWindow(date = new Date()): { start: number; end: number } {
  const d = new Date(date)
  const base = d.getTime()
  return { start: base - SESSION_MS, end: base }
}
