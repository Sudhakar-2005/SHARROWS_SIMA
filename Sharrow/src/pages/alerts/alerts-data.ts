import { SECTOR_NAME } from '@/data/universe'
import type { AssetAnalysis, MarketSnapshot } from '@/engine/cycle'
import { regimeDescription, regimeLabel } from '@/engine/regime'
import type { LearningEvent, MarketEvent, NewsItem, Prediction, Provenance, Quote } from '@/engine/types'
import { concentration, holdingRows, portfolioTotals, sectorAllocation } from '../portfolio/portfolio-data'

/** Pure derivation of priority-aware alerts from engine state. Simulated, labeled. */

export type AlertPriority = 'informational' | 'important' | 'high-risk'
export type AlertKind = 'regime' | 'signal' | 'risk' | 'scenario' | 'news' | 'event' | 'model'

export interface Alert {
  id: string
  priority: AlertPriority
  kind: AlertKind
  /** WHAT happened. */
  title: string
  /** WHY it matters. */
  why: string
  /** What supports it. */
  evidence: string[]
  at: number
  href?: string
  provenance: Provenance
}

export interface AlertInputs {
  snapshot: MarketSnapshot
  analyses: Record<string, AssetAnalysis>
  predictions: Prediction[]
  learnings: LearningEvent[]
  news: NewsItem[]
  events: MarketEvent[]
  quotes: Record<string, Quote>
}

export const PRIORITY_RANK: Record<AlertPriority, number> = {
  'high-risk': 0,
  important: 1,
  informational: 2,
}

export const PRIORITY_VARIANT: Record<AlertPriority, 'neg' | 'warn' | 'flow'> = {
  'high-risk': 'neg',
  important: 'warn',
  informational: 'flow',
}

export const PRIORITY_LABEL: Record<AlertPriority, string> = {
  'high-risk': 'High risk',
  important: 'Important',
  informational: 'Informational',
}

export const KIND_LABEL: Record<AlertKind, string> = {
  regime: 'Regime',
  signal: 'Signal',
  risk: 'Risk',
  scenario: 'Scenario',
  news: 'News',
  event: 'Event',
  model: 'Model',
}

const DAY = 86_400_000

/** Regime state and benchmark-sized moves — the screen's top escalations. */
function regimeAlerts(snapshot: MarketSnapshot): Alert[] {
  const r = snapshot.regime
  const out: Alert[] = []

  if (r.regime === 'stressed' || r.regime === 'risk-off') {
    out.push({
      id: 'alert-regime-escalation',
      priority: 'high-risk',
      kind: 'regime',
      title: `Market regime classified ${regimeLabel(r.regime)}`,
      why: regimeDescription(r.regime),
      evidence: [
        ...r.evidence.slice(0, 3),
        `Classifier confidence ${r.confidence}/100`,
        `Breadth ${Math.round(snapshot.breadth * 100)}% of constituents participating`,
      ],
      at: snapshot.at,
      href: '/markets?focus=regime',
      provenance: snapshot.provenance,
    })
  } else if (r.regime === 'defensive') {
    out.push({
      id: 'alert-regime-defensive',
      priority: 'important',
      kind: 'regime',
      title: `Market regime classified ${regimeLabel(r.regime)}`,
      why: regimeDescription(r.regime),
      evidence: [
        ...r.evidence.slice(0, 3),
        `Classifier confidence ${r.confidence}/100`,
        `Score ${r.score} on the −100 (risk-off) to +100 (constructive) scale`,
      ],
      at: snapshot.at,
      href: '/markets?focus=regime',
      provenance: snapshot.provenance,
    })
  }

  const move = snapshot.indexChangePct
  if (Math.abs(move) >= 1.5) {
    out.push({
      id: 'alert-benchmark-move',
      priority: move <= -2.5 ? 'high-risk' : 'important',
      kind: 'risk',
      title: `${snapshot.indexSymbol} ${move > 0 ? 'up' : 'down'} ${Math.abs(move).toFixed(1)}% in the session`,
      why:
        move < 0
          ? 'A benchmark move of this size reprices conviction across correlated names — scenario invalidation levels deserve a recheck.'
          : 'A benchmark move of this size lifts conviction across correlated names — worth confirming it is breadth-supported.',
      evidence: [
        `${snapshot.advancing} advancing · ${snapshot.declining} declining · ${snapshot.unchanged} unchanged`,
        `Breadth ${Math.round(snapshot.breadth * 100)}%`,
        `Realised volatility ${snapshot.volatilityPct}% against a ${snapshot.volatilityBaselinePct}% baseline`,
      ],
      at: snapshot.at,
      href: '/markets',
      provenance: snapshot.provenance,
    })
  }

  return out
}

/** Strongest non-neutral conviction read in the current cycle. */
function signalAlerts(analyses: Record<string, AssetAnalysis>): Alert[] {
  const ranked = Object.values(analyses)
    .filter((a) => a.conviction.direction !== 'neutral')
    .sort((a, b) => b.conviction.score - a.conviction.score)
  const top = ranked[0]
  if (!top || top.conviction.score < 70) return []
  const c = top.conviction
  const lead = c.contributing[0]
  return [
    {
      id: `alert-conviction-${top.symbol}`,
      priority: 'important',
      kind: 'signal',
      title: `${top.symbol} conviction at ${c.score} — ${c.direction} read`,
      why: lead
        ? `The strongest non-neutral read this cycle leads with "${lead.title}" — ${c.contributing.length} contributing signal${c.contributing.length === 1 ? '' : 's'} and ${c.counterSignals.length} counter-signal${c.counterSignals.length === 1 ? '' : 's'} still standing.`
        : `The strongest non-neutral read this cycle, built from ${c.contributing.length} contributing signals.`,
      evidence: [
        ...c.contributing.slice(0, 3).map((s) => `${s.title} · ${Math.round(s.confidence)}% confidence`),
        ...c.counterSignals.slice(0, 1).map((s) => `Counter-signal: ${s.title}`),
      ],
      at: top.computedAt,
      href: `/asset/${top.symbol}`,
      provenance: c.provenance,
    },
  ]
}

/** Concentration and drawdown checks against what the portfolio actually holds. */
function portfolioAlerts(quotes: Record<string, Quote>, now: number): Alert[] {
  const rows = holdingRows(quotes)
  if (rows.length === 0) return []
  const out: Alert[] = []
  const alloc = sectorAllocation(rows)
  const top = alloc[0]
  const conc = concentration(rows)
  const totals = portfolioTotals(rows)

  if (top && top.share >= 45) {
    out.push({
      id: 'alert-sector-concentration',
      priority: top.share >= 55 ? 'high-risk' : 'important',
      kind: 'risk',
      title: `${SECTOR_NAME[top.sector]} is ${top.share.toFixed(0)}% of your portfolio`,
      why: 'Sector weight above 45% means one sector drives the book — a rotation there would move overall value more than any single position.',
      evidence: [
        conc.top ? `Top position: ${conc.top.symbol} at ${conc.top.weight.toFixed(0)}% of value` : '',
        `Top 3 holdings: ${conc.top3Share.toFixed(0)}% of value`,
        `${conc.aboveTen} position${conc.aboveTen === 1 ? '' : 's'} above 10% of value`,
      ].filter(Boolean),
      at: now,
      href: '/portfolio?focus=risk',
      provenance: 'derived',
    })
  }

  if (conc.top3Share >= 60) {
    out.push({
      id: 'alert-position-concentration',
      priority: 'important',
      kind: 'risk',
      title: `Top 3 holdings are ${conc.top3Share.toFixed(0)}% of portfolio value`,
      why: 'Position-level concentration means outcome is dominated by a few names — single-name news would outweigh diversification.',
      evidence: [
        conc.top ? `${conc.top.symbol} alone is ${conc.top.weight.toFixed(0)}% of value` : '',
        `${rows.length} holdings in total`,
        top ? `Largest sector: ${SECTOR_NAME[top.sector]} at ${top.share.toFixed(0)}%` : '',
      ].filter(Boolean),
      at: now,
      href: '/portfolio?focus=risk',
      provenance: 'derived',
    })
  }

  if (totals && totals.dayChangePct <= -1) {
    out.push({
      id: 'alert-day-drawdown',
      priority: totals.dayChangePct <= -2.5 ? 'high-risk' : 'important',
      kind: 'risk',
      title: `Portfolio down ${Math.abs(totals.dayChangePct).toFixed(1)}% in the session`,
      why: 'A book-level move of this size is worth a look at which positions drove it and whether scenario invalidation levels still hold.',
      evidence: [
        `Day P&L ${totals.dayPnl >= 0 ? '+' : '−'}${Math.abs(totals.dayPnl).toLocaleString('en-IN')} rupees`,
        `${totals.count} holdings`,
        top ? `Largest sector: ${SECTOR_NAME[top.sector]} at ${top.share.toFixed(0)}%` : '',
      ].filter(Boolean),
      at: now,
      href: '/portfolio',
      provenance: 'derived',
    })
  }

  return out
}

/** Evaluated scenarios — misses escalate, strong matches stay informational. */
function scenarioAlerts(predictions: Prediction[]): Alert[] {
  const evaluated = predictions.filter((p) => p.evaluation)
  const out: Alert[] = []

  const missed = evaluated
    .filter((p) => p.evaluation!.verdict === 'missed' && p.confidence >= 55)
    .sort((a, b) => b.confidence - a.confidence)[0]
  if (missed && missed.evaluation) {
    out.push({
      id: `alert-missed-${missed.id}`,
      priority: 'important',
      kind: 'scenario',
      title: `${missed.symbol} scenario missed — scored and kept`,
      why: `A ${missed.confidence}%-confidence scenario resolved against expectation (${missed.evaluation.delta}). Misses are recorded rather than hidden: they feed calibration for comparable reads.`,
      evidence: [missed.evaluation.headline, ...missed.evaluation.factors.slice(0, 2)],
      at: missed.evaluation.at,
      href: '/predictions',
      provenance: 'backtest',
    })
  }

  const matched = evaluated
    .filter((p) => p.evaluation!.verdict === 'matched' && p.confidence >= 70)
    .sort((a, b) => b.evaluation!.at - a.evaluation!.at)[0]
  if (matched && matched.evaluation) {
    out.push({
      id: `alert-matched-${matched.id}`,
      priority: 'informational',
      kind: 'scenario',
      title: `${matched.symbol} scenario matched its expectation`,
      why: matched.evaluation.headline,
      evidence: [`Delta ${matched.evaluation.delta}`, ...matched.evaluation.factors.slice(0, 2)],
      at: matched.evaluation.at,
      href: '/predictions',
      provenance: 'backtest',
    })
  }

  return out
}

/** Material-to-holdings news — high impact escalates, the rest stays informational. */
function newsAlerts(news: NewsItem[]): Alert[] {
  return news
    .filter((n) => n.portfolioRelevance === 'material')
    .sort(
      (a, b) =>
        (b.marketImpact === 'high' ? 1 : 0) - (a.marketImpact === 'high' ? 1 : 0) ||
        b.publishedAt - a.publishedAt,
    )
    .slice(0, 2)
    .map((n) => ({
      id: `alert-news-${n.id}`,
      priority: n.marketImpact === 'high' ? 'important' : 'informational',
      kind: 'news',
      title: n.headline,
      why: `${n.summary} Marked material to holdings with ${n.marketImpact} market impact.`,
      evidence: [
        `Sentiment ${n.sentiment} · confidence ${n.confidence}`,
        `Affects ${n.affectedSymbols.join(', ')}`,
        `Source ${n.source}`,
      ],
      at: n.publishedAt,
      href: `/asset/${n.affectedSymbols[0] ?? 'NIFTY50'}`,
      provenance: n.provenance,
    }))
}

/** Scheduled events landing inside the next 10 days. */
function eventAlerts(events: MarketEvent[], now: number): Alert[] {
  return events
    .filter((e) => e.date > now && e.date - now <= 10 * DAY)
    .sort((a, b) => a.date - b.date)
    .map((e) => {
      const days = Math.max(1, Math.ceil((e.date - now) / DAY))
      return {
        id: `alert-event-${e.id}`,
        priority: 'informational' as const,
        kind: 'event' as const,
        title: `${e.label} in ${days} day${days === 1 ? '' : 's'}`,
        why:
          e.kind === 'earnings'
            ? `Results window for ${e.symbols.join(', ')} — expect conviction around these names to reprice around the print.`
            : `Scheduled ${e.kind} event affecting ${e.symbols.join(', ')} — context for how these names behave this week.`,
        evidence: [`Scheduled on the economic calendar`, `Category ${e.kind}`, `Affects ${e.symbols.join(' · ')}`],
        at: now,
        href: '/markets',
        provenance: 'simulated' as Provenance,
      }
    })
}

/** Newest validated learning — how the engine just improved. */
function modelAlerts(learnings: LearningEvent[]): Alert[] {
  const validated = learnings
    .filter((l) => l.status === 'validated')
    .sort((a, b) => (b.validatedAt ?? b.detectedAt) - (a.validatedAt ?? a.detectedAt))
  const l = validated[0]
  if (!l) return []
  return [
    {
      id: `alert-learning-${l.id}`,
      priority: 'informational',
      kind: 'model',
      title: `Learning validated — ${l.title}`,
      why: `${l.detail} Supported by ${l.sampleSize} evaluated record${l.sampleSize === 1 ? '' : 's'}${l.effectSize !== undefined ? ` with an effect size of ${l.effectSize.toFixed(2)}` : ''}.`,
      evidence: l.evidence.slice(0, 3),
      at: l.validatedAt ?? l.detectedAt,
      href: '/evolution',
      provenance: l.provenance,
    },
  ]
}

/** All alerts, sorted by priority then recency. */
export function buildAlerts(inputs: AlertInputs): Alert[] {
  const now = inputs.snapshot.at
  return [
    ...regimeAlerts(inputs.snapshot),
    ...signalAlerts(inputs.analyses),
    ...portfolioAlerts(inputs.quotes, now),
    ...scenarioAlerts(inputs.predictions),
    ...newsAlerts(inputs.news),
    ...eventAlerts(inputs.events, now),
    ...modelAlerts(inputs.learnings),
  ].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.at - a.at)
}

export function priorityCounts(alerts: Alert[]): Record<AlertPriority, number> {
  const counts: Record<AlertPriority, number> = { 'high-risk': 0, important: 0, informational: 0 }
  for (const a of alerts) counts[a.priority] += 1
  return counts
}

export type PriorityFilter = 'all' | AlertPriority

export function filterByPriority(alerts: Alert[], filter: PriorityFilter): Alert[] {
  return filter === 'all' ? alerts : alerts.filter((a) => a.priority === filter)
}

/** Reads `?priority=` — the command palette deep-links with priority=important. */
export function parsePriority(value: string | null): PriorityFilter | null {
  if (value === 'informational' || value === 'important' || value === 'high-risk') return value
  return null
}
