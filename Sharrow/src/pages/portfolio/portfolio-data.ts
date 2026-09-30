import type { Quote, SectorId } from '@/engine/types'
import { ASSET_BY_SYMBOL, PORTFOLIO_HOLDINGS, SECTOR_NAME } from '@/data/universe'
import { inr, percent } from '@/lib/format'

/** Pure helpers for the portfolio screen. All values are simulated. */

export interface HoldingRow {
  symbol: string
  name: string
  sector: SectorId
  quantity: number
  avgPrice: number
  invested: number
  value: number
  pnl: number
  pnlPct: number
  dayPnl: number
  changePct: number
  weight: number
}

export function holdingRows(quotes: Record<string, Quote>): HoldingRow[] {
  const raw = PORTFOLIO_HOLDINGS.map((h) => {
    const q = quotes[h.symbol]
    if (!q) return null
    const invested = h.quantity * h.avgPrice
    const value = h.quantity * q.price
    const dayPnl = h.quantity * (q.price - q.prevClose)
    return {
      symbol: h.symbol,
      name: ASSET_BY_SYMBOL[h.symbol]?.name ?? h.symbol,
      sector: ASSET_BY_SYMBOL[h.symbol]?.sector ?? 'infra',
      quantity: h.quantity,
      avgPrice: h.avgPrice,
      invested,
      value,
      pnl: value - invested,
      pnlPct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
      dayPnl,
      changePct: q.changePct,
      weight: 0,
    } satisfies HoldingRow
  }).filter((r): r is HoldingRow => r !== null)

  const total = raw.reduce((sum, r) => sum + r.value, 0)
  for (const r of raw) r.weight = total > 0 ? (r.value / total) * 100 : 0
  return raw.sort((a, b) => b.value - a.value)
}

export interface PortfolioTotals {
  value: number
  invested: number
  pnl: number
  pnlPct: number
  dayPnl: number
  dayChangePct: number
  count: number
}

export function portfolioTotals(rows: HoldingRow[]): PortfolioTotals | null {
  if (rows.length === 0) return null
  let value = 0
  let invested = 0
  let dayPnl = 0
  let weightedDay = 0
  for (const r of rows) {
    value += r.value
    invested += r.invested
    dayPnl += r.dayPnl
    weightedDay += r.value * r.changePct
  }
  return {
    value: Math.round(value),
    invested: Math.round(invested),
    pnl: Math.round(value - invested),
    pnlPct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
    dayPnl: Math.round(dayPnl),
    dayChangePct: value > 0 ? weightedDay / value : 0,
    count: rows.length,
  }
}

export interface SectorSlice {
  sector: SectorId
  value: number
  share: number
}

export function sectorAllocation(rows: HoldingRow[]): SectorSlice[] {
  const total = rows.reduce((sum, r) => sum + r.value, 0)
  const map = new Map<SectorId, number>()
  for (const r of rows) map.set(r.sector, (map.get(r.sector) ?? 0) + r.value)
  return [...map.entries()]
    .map(([sector, value]) => ({
      sector,
      value: Math.round(value),
      share: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

/** Largest day gainers / drags by rupee contribution. */
export function dayDrivers(rows: HoldingRow[], mode: 'gain' | 'loss', limit = 3): HoldingRow[] {
  const sorted = [...rows].sort((a, b) =>
    mode === 'gain' ? b.dayPnl - a.dayPnl : a.dayPnl - b.dayPnl,
  )
  return sorted.filter((r) => (mode === 'gain' ? r.dayPnl > 0 : r.dayPnl < 0)).slice(0, limit)
}

export interface Concentration {
  top: HoldingRow | null
  top3Share: number
  aboveTen: number
}

export function concentration(rows: HoldingRow[]): Concentration {
  const total = rows.reduce((sum, r) => sum + r.value, 0)
  const top3 = rows.slice(0, 3).reduce((sum, r) => sum + r.value, 0)
  return {
    top: rows[0] ?? null,
    top3Share: total > 0 ? (top3 / total) * 100 : 0,
    aboveTen: rows.filter((r) => r.weight > 10).length,
  }
}

export interface PortfolioNarrative {
  headline: string
  points: string[]
}

/**
 * Deterministic plain-language explanation of what moved the portfolio today.
 * Safe language only — descriptive, never prescriptive.
 */
export function portfolioNarrative(
  totals: PortfolioTotals,
  rows: HoldingRow[],
  benchmarkChangePct: number,
  topSector: SectorId,
  topSectorShare: number,
): PortfolioNarrative {
  const diff = totals.dayChangePct - benchmarkChangePct
  const gainers = dayDrivers(rows, 'gain')
  const losers = dayDrivers(rows, 'loss')

  const dayTone =
    totals.dayPnl > 0 ? 'added' : totals.dayPnl < 0 ? 'given back' : 'held flat at'
  const beatLag = Math.abs(diff) < 0.02 ? 'in line with' : diff > 0 ? 'ahead of' : 'behind'

  const drivers: string[] = []
  if (gainers.length > 0) {
    drivers.push(
      `${gainers.map((g) => g.symbol).join(', ')} ${gainers.length === 1 ? 'was' : 'were'} the largest contributor${gainers.length === 1 ? '' : 's'} to the upside`,
    )
  }
  if (losers.length > 0) {
    drivers.push(
      `${losers.map((l) => l.symbol).join(', ')} ${losers.length === 1 ? 'was' : 'were'} the main drag`,
    )
  }

  return {
    headline: `Your holdings ${dayTone} ${inr(Math.abs(totals.dayPnl), 0)} today (${percent(totals.dayChangePct, 2)}), ${beatLag} the benchmark's ${percent(benchmarkChangePct, 2)}.`,
    points: [
      ...(drivers.length > 0 ? [drivers.join('; ') + '.'] : []),
      `Exposure is concentrated in ${SECTOR_NAME[topSector]} at ${topSectorShare}% of value — concentration shapes how the portfolio behaves when that sector moves.`,
      `Overall the book is ${totals.pnl >= 0 ? 'up' : 'down'} ${inr(Math.abs(totals.pnl), 0)} (${percent(totals.pnlPct, 2)}) versus invested value across ${totals.count} holdings.`,
      'Reads are simulated, labeled and recomputed each cycle — this is an explanation of the current state, not a recommendation.',
    ],
  }
}

/** Compact signed rupee, e.g. "+₹1,240" / "−₹860". */
export function rupeeSigned(value: number): string {
  return `${value >= 0 ? '+' : '−'}${inr(Math.abs(value), 0)}`
}

/** Direction tone class for rupee / percent values. */
export function valueTone(value: number): string {
  return value > 0 ? 'text-pos' : value < 0 ? 'text-neg' : 'text-flow'
}
