import type { Candle, Quote } from '@/engine/types'
import { ASSET_BY_SYMBOL, BASE_PRICE, EQUITY_SYMBOLS, INDEX_SYMBOLS } from '@/data/universe'
import { getDailySeries, hashString, mulberry32, betaFor } from './simulated'

/* =========================================================================
   Live quote state for the simulated feed.
   Prices evolve continuously (this is a simulation, labelled as such);
   high/low/volume track the evolving session.
   ========================================================================= */

const live = new Map<string, number>()
const prevClose = new Map<string, number>()
const dayHigh = new Map<string, number>()
const dayLow = new Map<string, number>()
const volume = new Map<string, number>()
const updatedAt = new Map<string, number>()
const tickers = new Map<string, () => number>()

const ALL_SYMBOLS = [...INDEX_SYMBOLS, ...EQUITY_SYMBOLS]

/**
 * Session overlay: the day's cross-sectional move is generated per calendar
 * day (shared factor + per-symbol idio) so sessions read like real tape —
 * mixed advances and declines — instead of inheriting the series tail.
 */
function sessionFactorFor(now: number): number {
  const dayKey = new Date(now).toDateString()
  const rng = mulberry32(hashString(`session-${dayKey}`))
  // Range ≈ −0.54% … +0.86%, centred slightly positive over time.
  return (rng() - 0.45) * 0.012
}

export function seedQuotes(now = Date.now()) {
  if (live.size > 0) return
  const dayKey = new Date(now).toDateString()
  const sessionFactor = sessionFactorFor(now)

  for (const symbol of ALL_SYMBOLS) {
    const daily = getDailySeries(symbol)
    const last = daily[daily.length - 1]
    const prev = daily[daily.length - 2] ?? last

    const rng = mulberry32(hashString(`${symbol}-session-${dayKey}`))
    const idioRange = ASSET_BY_SYMBOL[symbol]?.kind === 'index' ? 0.002 : 0.009
    const idio = ((rng() + rng() + rng() - 1.5) / 1.5) * idioRange
    const sessionReturn = sessionFactor * betaFor(symbol) + idio
    const price = Math.max(0.05, Math.round(prev.c * (1 + sessionReturn) * 100) / 100)

    live.set(symbol, price)
    prevClose.set(symbol, prev.c)
    dayHigh.set(symbol, Math.max(price, prev.c * 1.003))
    dayLow.set(symbol, Math.min(price, prev.c * 0.997))
    volume.set(symbol, last.v)
    updatedAt.set(symbol, now)
    tickers.set(symbol, mulberry32(hashString(`${symbol}-tick`)))
  }
}

function dailyVol(symbol: string): number {
  const asset = ASSET_BY_SYMBOL[symbol]
  if (asset?.kind === 'index') return 0.007
  const sectorVol: Record<string, number> = {
    it: 0.013,
    banks: 0.014,
    fmcg: 0.009,
    auto: 0.017,
    pharma: 0.011,
    energy: 0.015,
    metals: 0.021,
    infra: 0.015,
  }
  return sectorVol[asset?.sector ?? 'infra'] ?? 0.014
}

/**
 * Ticks are micro-moves, not whole days: a full session of 2s-cadence ticks
 * should wander only a fraction of daily vol, so the seeded session tape
 * stays coherent and breadth does not drift between intelligence cycles.
 */
const TICKS_PER_SESSION = 9450 // 2s cadence across a 5.25h NSE session
const SESSION_WALK_SHARE = 0.35

/** Advance every symbol one tick. Returns the number of symbols moved. */
export function tickQuotes(now = Date.now()): number {
  seedQuotes(now)
  let moved = 0
  for (const symbol of ALL_SYMBOLS) {
    const rng = tickers.get(symbol)!
    const price = live.get(symbol)!
    const perTick = (dailyVol(symbol) * SESSION_WALK_SHARE) / Math.sqrt(TICKS_PER_SESSION)
    const shock = (rng() + rng() + rng() - 1.5) * 1.2 * perTick
    const next = Math.max(0.05, price * (1 + shock))
    if (Math.abs(next - price) / price > 0.00005) moved++
    live.set(symbol, next)
    dayHigh.set(symbol, Math.max(dayHigh.get(symbol) ?? next, next))
    dayLow.set(symbol, Math.min(dayLow.get(symbol) ?? next, next))
    updatedAt.set(symbol, now)
  }
  return moved
}

export function computeQuote(symbol: string): Quote {
  seedQuotes()
  const price = live.get(symbol)!
  const prev = prevClose.get(symbol) ?? price
  const change = price - prev
  return {
    symbol,
    price,
    prevClose: prev,
    change,
    changePct: (change / prev) * 100,
    dayHigh: dayHigh.get(symbol) ?? price,
    dayLow: dayLow.get(symbol) ?? price,
    volume: volume.get(symbol) ?? 0,
    updatedAt: updatedAt.get(symbol) ?? Date.now(),
    provenance: 'simulated',
  }
}

export function getLivePrice(symbol: string): number {
  seedQuotes()
  return live.get(symbol) ?? BASE_PRICE[symbol] ?? 0
}

/** Replace the final candle with the live tick so charts stay continuous. */
export function withLiveTail(symbol: string, candles: Candle[]): Candle[] {
  if (candles.length === 0) return candles
  seedQuotes()
  const price = live.get(symbol)!
  const last = candles[candles.length - 1]
  const next = candles.slice()
  next[next.length - 1] = {
    ...last,
    c: price,
    h: Math.max(last.h, price),
    l: Math.min(last.l, price),
  }
  return next
}

export function lastUpdatedAt(symbol: string): number {
  seedQuotes()
  return updatedAt.get(symbol) ?? 0
}

export function allSymbols(): string[] {
  return ALL_SYMBOLS
}
