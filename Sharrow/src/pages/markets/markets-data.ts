import type { MarketEventKind, Quote, SectorId } from '@/engine/types'
import { EQUITY_SYMBOLS, SECTORS } from '@/data/universe'
import { timeAgo } from '@/lib/format'

/** Shared, pure helpers for the markets screen. */

const DAY_MS = 86_400_000

export const KIND_VARIANT: Record<MarketEventKind, 'accent' | 'violet' | 'warn' | 'flow'> = {
  earnings: 'accent',
  policy: 'violet',
  macro: 'warn',
  corporate: 'flow',
}

export const KIND_LABEL: Record<MarketEventKind, string> = {
  earnings: 'Earnings',
  policy: 'Policy',
  macro: 'Macro',
  corporate: 'Corporate',
}

/** Compact scheduling label relative to the reference cycle time. */
export function untilLabel(date: number, now: number): string {
  const days = Math.round((date - now) / DAY_MS)
  if (days <= 0) return timeAgo(date, now)
  if (days === 1) return 'tomorrow'
  return `in ${days}d`
}

export interface Mover {
  symbol: string
  quote: Quote
}

export function topMovers(
  quotes: Record<string, Quote>,
  mode: 'gainers' | 'losers',
  limit = 5,
): Mover[] {
  return EQUITY_SYMBOLS.filter((s) => quotes[s])
    .map((symbol) => ({ symbol, quote: quotes[symbol] }))
    .sort((a, b) =>
      mode === 'gainers'
        ? b.quote.changePct - a.quote.changePct
        : a.quote.changePct - b.quote.changePct,
    )
    .slice(0, limit)
}

/** 0–1 position of the last price inside the session range. */
export function rangePosition(quote: Quote): number {
  const span = quote.dayHigh - quote.dayLow
  if (span <= 0) return 0.5
  return Math.max(0, Math.min(1, (quote.price - quote.dayLow) / span))
}

export const SECTOR_SHORT: Record<SectorId, string> = {
  it: 'IT',
  banks: 'Banks',
  fmcg: 'FMCG',
  auto: 'Auto',
  pharma: 'Pharma',
  energy: 'Energy',
  metals: 'Metals',
  infra: 'Infra',
}

export const SECTOR_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All sectors' },
  ...SECTORS.map((s) => ({ value: s.id, label: s.name })),
]
