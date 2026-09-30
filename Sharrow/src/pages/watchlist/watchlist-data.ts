import type { Prediction, PredictionOutcome, SignalDirection } from '@/engine/types'
import type { AssetAnalysis } from '@/engine/cycle'
import type { ConvictionPoint } from '@/store/intelligence-store'
import { cn } from '@/lib/cn'

/** Pure helpers for the watchlist screen: stats, shifts and the attention feed. */

/** Text tone for a signed conviction delta. */
export function deltaTone(delta: number): string {
  return cn('num', delta > 0 ? 'text-pos' : delta < 0 ? 'text-neg' : 'text-flow')
}

export interface WatchStats {
  monitored: number
  advancing: number
  declining: number
  avgConviction: number | null
  scenarios: number
}

export function watchStats(
  watched: string[],
  analyses: Record<string, AssetAnalysis>,
  predictions: Prediction[],
): WatchStats {
  let advancing = 0
  let declining = 0
  let scoreSum = 0
  let scored = 0

  for (const symbol of watched) {
    const analysis = analyses[symbol]
    if (!analysis) continue
    const direction = analysis.conviction.direction
    if (direction === 'bullish') advancing += 1
    else if (direction === 'bearish') declining += 1
    scoreSum += analysis.conviction.score
    scored += 1
  }

  const scenarios = predictions.filter(
    (p) =>
      watched.includes(p.symbol) &&
      (p.status === 'active' || p.status === 'created') &&
      !p.evaluation,
  ).length

  return {
    monitored: watched.length,
    advancing,
    declining,
    avgConviction: scored > 0 ? Math.round(scoreSum / scored) : null,
    scenarios,
  }
}

/** Conviction delta between the two most recent cycle readings, when available. */
export function convictionShift(series: ConvictionPoint[] | undefined): number | null {
  if (!series || series.length < 2) return null
  return series[series.length - 1].score - series[series.length - 2].score
}

export type WatchFeedItem =
  | {
      id: string
      kind: 'flip'
      symbol: string
      at: number
      from: SignalDirection
      to: SignalDirection
    }
  | { id: string; kind: 'shift'; symbol: string; at: number; delta: number; score: number }
  | {
      id: string
      kind: 'scenario'
      symbol: string
      at: number
      status: 'opened' | 'evaluated'
      headline: string
      outcome?: PredictionOutcome
    }

const FEED_LIMIT = 8
const SHIFT_THRESHOLD = 3

/**
 * Attention feed for monitored assets: read flips and conviction moves from
 * cycle history, plus scenario status (opened / evaluated). Newest first.
 */
export function watchFeed(
  watched: string[],
  history: Record<string, ConvictionPoint[]>,
  predictions: Prediction[],
): WatchFeedItem[] {
  const items: WatchFeedItem[] = []
  const watchedSet = new Set(watched)

  for (const symbol of watched) {
    const series = history[symbol]
    if (series && series.length >= 2) {
      const last = series[series.length - 1]
      const prev = series[series.length - 2]
      const delta = last.score - prev.score
      if (last.direction !== prev.direction) {
        items.push({
          id: `flip-${symbol}-${last.at}`,
          kind: 'flip',
          symbol,
          at: last.at,
          from: prev.direction,
          to: last.direction,
        })
      } else if (Math.abs(delta) >= SHIFT_THRESHOLD) {
        items.push({
          id: `shift-${symbol}-${last.at}`,
          kind: 'shift',
          symbol,
          at: last.at,
          delta,
          score: last.score,
        })
      }
    }
  }

  for (const p of predictions) {
    if (!watchedSet.has(p.symbol)) continue
    if (p.evaluation) {
      items.push({
        id: `eval-${p.id}`,
        kind: 'scenario',
        symbol: p.symbol,
        at: p.evaluation.at,
        status: 'evaluated',
        headline: p.evaluation.headline,
        outcome: p.evaluation.verdict,
      })
    } else if (p.status === 'active' || p.status === 'created') {
      items.push({
        id: `open-${p.id}`,
        kind: 'scenario',
        symbol: p.symbol,
        at: p.createdAt,
        status: 'opened',
        headline: p.title,
      })
    }
  }

  return items.sort((a, b) => b.at - a.at).slice(0, FEED_LIMIT)
}
