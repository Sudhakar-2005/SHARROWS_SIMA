import type {
  ActivityEvent,
  Candle,
  Insight,
  Prediction,
  Provenance,
  Quote,
  SectorId,
  Signal,
} from './types'
import { assessRegime, type RegimeAssessment } from './regime'
import {
  contextSignals,
  fundamentalSignals,
  newsSignals,
  technicalSignals,
  type NewsLike,
} from './signals'
import { computeConviction, scoreBucket } from './conviction'
import { closes as toCloses, volatility } from './indicators'
import {
  ASSET_BY_SYMBOL,
  EQUITY_SYMBOLS,
  FUNDAMENTALS,
  INDEX_SYMBOLS,
  PORTFOLIO_HOLDINGS,
  SECTOR_NAME,
} from '@/data/universe'
import { getDailySeries, withLiveTail } from '@/services/market-data'

/* =========================================================================
   Observation cycle: market → regime → signals → conviction → insights →
   activity. Pure with an injectable series source so tests stay offline.
   ========================================================================= */

export type SeriesProvider = (symbol: string) => Candle[]

/** Default source: the simulated series with today's live tick applied. */
const defaultSeries: SeriesProvider = (symbol) => withLiveTail(symbol, getDailySeries(symbol))

export interface AssetAnalysis {
  symbol: string
  sector: SectorId
  signals: Signal[]
  conviction: ReturnType<typeof computeConviction>
  computedAt: number
}

export interface SectorPerformance {
  sector: SectorId
  name: string
  changePct: number
  relativePct: number
  leader: { symbol: string; changePct: number }
}

export interface MarketSnapshot {
  at: number
  regime: RegimeAssessment
  breadth: number
  advancing: number
  declining: number
  unchanged: number
  indexSymbol: string
  indexChangePct: number
  /** Derived 20-session volatility of the benchmark, annualised %. */
  volatilityPct: number
  volatilityBaselinePct: number
  sectorPerformance: SectorPerformance[]
  provenance: Provenance
}

/* ------------------------------- Helpers -------------------------------- */

let peBandCache: Map<SectorId, { pe: [number, number] }> | null = null

function sectorPeBand(sector: SectorId): { pe: [number, number] } {
  if (!peBandCache) {
    peBandCache = new Map()
    const buckets = new Map<SectorId, number[]>()
    for (const [symbol, f] of Object.entries(FUNDAMENTALS)) {
      const meta = ASSET_BY_SYMBOL[symbol]
      if (!meta) continue
      const list = buckets.get(meta.sector) ?? []
      list.push(f.pe)
      buckets.set(meta.sector, list)
    }
    for (const [id, list] of buckets) {
      const sorted = [...list].sort((a, b) => a - b)
      const lo = sorted[Math.floor(sorted.length * 0.2)] ?? 10
      const hi = sorted[Math.floor(sorted.length * 0.8)] ?? 40
      peBandCache.set(id, { pe: [Number(lo.toFixed(1)), Number(hi.toFixed(1))] })
    }
  }
  return peBandCache.get(sector) ?? { pe: [12, 40] }
}

function dayPosition(quote: Quote | undefined): number {
  if (!quote) return 0.5
  const range = quote.dayHigh - quote.dayLow
  if (range <= 0) return 0.5
  return Math.max(0, Math.min(1, (quote.price - quote.dayLow) / range))
}

/* ----------------------------- Market snapshot -------------------------- */

export function buildMarketSnapshot(opts: {
  quotes: Record<string, Quote>
  now: number
  seriesProvider?: SeriesProvider
}): MarketSnapshot {
  const { quotes, now } = opts
  const series = opts.seriesProvider ?? defaultSeries

  let advancing = 0
  let declining = 0
  let unchanged = 0
  const bySector = new Map<SectorId, { sum: number; count: number; leader: { symbol: string; changePct: number } }>()

  for (const symbol of EQUITY_SYMBOLS) {
    const quote = quotes[symbol]
    if (!quote) continue
    if (quote.changePct > 0.05) advancing++
    else if (quote.changePct < -0.05) declining++
    else unchanged++

    const meta = ASSET_BY_SYMBOL[symbol]
    const sector = meta?.sector ?? 'infra'
    const entry = bySector.get(sector) ?? {
      sum: 0,
      count: 0,
      leader: { symbol, changePct: quote.changePct },
    }
    entry.sum += quote.changePct
    entry.count += 1
    if (quote.changePct > entry.leader.changePct) entry.leader = { symbol, changePct: quote.changePct }
    bySector.set(sector, entry)
  }

  const total = advancing + declining + unchanged
  const breadth = total > 0 ? advancing / total : 0.5

  const indexSymbol = INDEX_SYMBOLS[0] ?? 'NIFTY50'
  const indexQuote = quotes[indexSymbol]
  const indexChangePct = indexQuote?.changePct ?? 0
  const indexCloses = toCloses(series(indexSymbol))

  const regime = assessRegime({ closes: indexCloses, breadth })

  const sectorPerformance: SectorPerformance[] = [...bySector.entries()]
    .map(([sector, e]) => ({
      sector,
      name: SECTOR_NAME[sector] ?? sector,
      changePct: Number((e.sum / e.count).toFixed(2)),
      relativePct: Number((e.sum / e.count - indexChangePct).toFixed(2)),
      leader: e.leader,
    }))
    .sort((a, b) => b.changePct - a.changePct)

  const volatilityPct = Number((((volatility(indexCloses, 20) ?? 0.14) * 100)).toFixed(1))
  const volatilityBaselinePct = Number(
    (((volatility(indexCloses.slice(0, -20), 120) ?? volatilityPct / 100) * 100)).toFixed(1),
  )

  return {
    at: now,
    regime,
    breadth,
    advancing,
    declining,
    unchanged,
    indexSymbol,
    indexChangePct: Number(indexChangePct.toFixed(2)),
    volatilityPct,
    volatilityBaselinePct,
    sectorPerformance,
    provenance: 'derived',
  }
}

/* ----------------------------- Asset analysis --------------------------- */

export function buildAssetAnalysis(opts: {
  symbol: string
  quotes: Record<string, Quote>
  snapshot: MarketSnapshot
  news: NewsLike[]
  now: number
  seriesProvider?: SeriesProvider
}): AssetAnalysis {
  const { symbol, quotes, snapshot, news, now } = opts
  const series = opts.seriesProvider ?? defaultSeries
  const meta = ASSET_BY_SYMBOL[symbol]
  const sector = meta?.sector ?? 'infra'
  const candles = series(symbol)
  const quote = quotes[symbol]

  const ownNews = news.filter((n) => n.affectedSymbols?.includes(symbol) ?? false)

  const signals: Signal[] = [
    ...technicalSignals(symbol, candles, now),
    ...(meta?.kind === 'equity'
      ? fundamentalSignals(symbol, FUNDAMENTALS[symbol], sectorPeBand(sector), now)
      : []),
    ...newsSignals(symbol, ownNews, now),
    ...contextSignals(
      symbol,
      sector,
      snapshot.regime.regime,
      snapshot.regime.confidence,
      sectorPerformanceOf(snapshot, sector),
      snapshot.indexChangePct,
      dayPosition(quote),
      now,
    ),
  ]

  const conviction = computeConviction({
    signals,
    regime: snapshot.regime.regime,
    now,
  })

  return { symbol, sector, signals, conviction, computedAt: now }
}

function sectorPerformanceOf(snapshot: MarketSnapshot, sector: SectorId): number {
  return snapshot.sectorPerformance.find((s) => s.sector === sector)?.changePct ?? 0
}

/* -------------------------------- Insights ------------------------------ */

export interface InsightInput {
  snapshot: MarketSnapshot
  analyses: AssetAnalysis[]
  quotes: Record<string, Quote>
  previousRegime?: { regime: string; at: number }
  predictions: Prediction[]
  now: number
}

export function generateInsights(input: InsightInput): Insight[] {
  const { snapshot, analyses, previousRegime, predictions, now } = input
  const out: Insight[] = []
  const regime = snapshot.regime

  // 1. Regime change / steady state
  if (previousRegime && previousRegime.regime !== regime.regime) {
    const worsened =
      ['risk-off', 'stressed', 'defensive', 'neutral', 'constructive'].indexOf(regime.regime) >
      ['risk-off', 'stressed', 'defensive', 'neutral', 'constructive'].indexOf(previousRegime.regime)
    out.push({
      id: `insight-regime-shift-${now}`,
      kind: 'regime',
      headline: `Regime shifted: ${previousRegime.regime} → ${regime.regime}`,
      why: `${[regime.evidence[0], regime.evidence[2]].filter(Boolean).join('. ')} The classifier now reads “${regime.regime}” at ${regime.confidence}% confidence.`.trim(),
      importance: worsened ? 'critical' : 'important',
      confidence: regime.confidence,
      changed: `Composite score moved to ${regime.score} under a ${regime.regime} reading.`,
      risk: worsened
        ? 'Cyclical exposures typically carry more risk in weaker regimes.'
        : undefined,
      invalidation: 'A reversal of breadth and volatility inputs would move the reading back.',
      createdAt: now,
      sources: [{ label: 'SHARROW regime classifier', kind: 'engine', at: now }],
      provenance: 'derived',
      href: '/markets',
    })
  } else if (Math.abs(regime.score) > 0) {
    out.push({
      id: `insight-regime-state-${now}`,
      kind: 'regime',
      headline: `Regime holds at “${regime.regime}”`,
      why: `${regime.evidence.slice(0, 2).join('. ')} — the composite reads ${regime.score} with ${regime.confidence}% classifier confidence.`,
      importance: regime.regime === 'stressed' || regime.regime === 'risk-off' ? 'critical' : 'informational',
      confidence: regime.confidence,
      changed: 'No state change in this cycle.',
      createdAt: now,
      sources: [{ label: 'SHARROW regime classifier', kind: 'engine', at: now }],
      provenance: 'derived',
      href: '/markets',
    })
  }

  // 2. Top conviction assets
  const top = [...analyses]
    .filter((a) => a.conviction.direction !== 'neutral' && a.conviction.score >= 50)
    .sort((a, b) => b.conviction.score - a.conviction.score)
    .slice(0, 3)

  for (const a of top) {
    const lead =
      a.conviction.contributing.find((s) => s.symbol === a.symbol && s.kind !== 'context') ??
      a.conviction.contributing.find((s) => s.symbol === a.symbol) ??
      a.conviction.contributing[0]
    const counter = a.conviction.counterSignals[0]
    const score = a.conviction.score
    out.push({
      id: `insight-conviction-${a.symbol}-${now}`,
      symbol: a.symbol,
      kind: 'momentum',
      headline: `${a.symbol} reads ${a.conviction.direction} at ${score}/100`,
      why: `${lead ? `${lead.title}. ${lead.summary}${lead.evidence.length ? ` ${lead.evidence.slice(0, 2).map((e) => `${e.label} ${e.value}`).join(' · ')}.` : ''}` : 'Multiple aligned inputs.'} Regime context: ${snapshot.regime.regime} at ${snapshot.regime.confidence}% confidence.`,
      importance: score >= 72 ? 'critical' : score >= 58 ? 'important' : 'informational',
      confidence: score,
      changed: `${a.conviction.contributing.length} supporting signals vs ${a.conviction.counterSignals.length} counter-signals in this cycle.`,
      risk: counter ? `${counter.title}: ${counter.summary}` : undefined,
      invalidation: 'Scenario invalidation levels live with the tracked scenario.',
      createdAt: now,
      sources: [
        { label: 'SHARROW signal engine', kind: 'engine', at: now },
        { label: 'Simulated price series', kind: 'dataset', at: now },
      ],
      provenance: 'derived',
      href: `/asset/${a.symbol}`,
    })
  }

  // 3. Sector leadership
  const best = snapshot.sectorPerformance[0]
  const worst = snapshot.sectorPerformance[snapshot.sectorPerformance.length - 1]
  if (best && worst && best.sector !== worst.sector) {
    const spread = Number((best.changePct - worst.changePct).toFixed(2))
    out.push({
      id: `insight-sector-spread-${now}`,
      kind: 'sector',
      headline: `Leadership: ${best.name} leads ${worst.name} by ${spread} pts`,
      why: `${best.name} averages ${best.changePct.toFixed(2)}% with ${best.leader.symbol} the top mover; ${worst.name} averages ${worst.changePct.toFixed(2)}% against the benchmark’s ${snapshot.indexChangePct.toFixed(2)}%.`,
      importance: spread > 2 ? 'important' : 'informational',
      confidence: 70,
      changed: `Session spread of ${spread} points between the strongest and weakest sectors.`,
      createdAt: now,
      sources: [{ label: 'Simulated sector snapshot', kind: 'dataset', at: now }],
      provenance: 'simulated',
      href: '/markets',
    })
  }

  // 4. Portfolio vs benchmark
  const p = computePortfolio(input.quotes)
  if (p) {
    const diff = Number((p.changePct - snapshot.indexChangePct).toFixed(2))
    out.push({
      id: `insight-portfolio-${now}`,
      kind: 'portfolio',
      headline:
        Math.abs(diff) < 0.05
          ? 'Portfolio moved in line with the benchmark today'
          : `Portfolio ${diff > 0 ? 'ahead of' : 'behind'} benchmark by ${Math.abs(diff)} pts today`,
      why: `Holdings-weighted return of ${p.changePct.toFixed(2)}% versus the index at ${snapshot.indexChangePct.toFixed(2)}%. Top sector exposure: ${SECTOR_NAME[p.topSector]} at ${p.topSectorShare}% of value.`,
      importance: Math.abs(diff) >= 1 ? 'important' : 'informational',
      confidence: 75,
      changed: `Day contribution led by ${p.topMover.symbol} at ${p.topMover.changePct.toFixed(2)}%.`,
      risk: p.topSectorShare > 45
        ? `${SECTOR_NAME[p.topSector]} exposure above 45% of value — concentration risk if that sector rotates.`
        : undefined,
      createdAt: now,
      sources: [{ label: 'Simulated holdings', kind: 'dataset', at: now }],
      provenance: 'simulated',
      href: '/portfolio',
    })
  }

  // 5. Volatility risk
  if (snapshot.volatilityPct > snapshot.volatilityBaselinePct * 1.35) {
    out.push({
      id: `insight-volatility-${now}`,
      kind: 'risk',
      headline: `Volatility running ${snapshot.volatilityPct}% — ${(((snapshot.volatilityPct / snapshot.volatilityBaselinePct) - 1) * 100).toFixed(0)}% above baseline`,
      why: `Benchmark 20-session volatility is ${snapshot.volatilityPct}% annualised against a ${snapshot.volatilityBaselinePct}% baseline. Scenario magnitudes scale with this input, so expected moves widen. `,
      importance: 'important',
      confidence: Math.min(snapshot.regime.confidence + 5, 92),
      changed: 'Volatility input feeds conviction sizing and scenario ranges.',
      invalidation: 'A return of realised volatility toward baseline restores prior scenario ranges.',
      createdAt: now,
      sources: [{ label: 'SHARROW volatility model', kind: 'engine', at: now }],
      provenance: 'derived',
      href: '/markets',
    })
  }

  // 6. Calibration / learning — counted from evaluated scenarios, if any.
  const evaluated = predictions.filter(
    (p) => p.evaluation && p.outcome && p.outcome !== 'inconclusive',
  )
  if (evaluated.length >= 3) {
    const groups = new Map<string, { total: number; matched: number }>()
    for (const p of evaluated) {
      const key = scoreBucket(p.confidence)
      const g = groups.get(key) ?? { total: 0, matched: 0 }
      g.total += 1
      if (p.evaluation!.verdict === 'matched') g.matched += 1
      groups.set(key, g)
    }
    const [band, g] = [...groups.entries()].sort((a, b) => b[1].total - a[1].total)[0]
    const hitPct = Math.round((g.matched / g.total) * 100)
    out.push({
      id: `insight-calibration-${now}`,
      kind: 'calibration',
      headline: `${band.charAt(0).toUpperCase()}${band.slice(1)} hit rate: ${hitPct}% over ${g.total} records`,
      why: `Evaluated scenarios are counted, not asserted — ${g.matched} of ${g.total} in this band matched outright, and the observed rate is used to size future confidence.`,
      importance: 'informational',
      confidence: Math.min(50 + g.total * 4, 85),
      changed: 'Calibration refreshes each evaluation cycle.',
      createdAt: now,
      sources: [{ label: 'SHARROW evaluation ledger', kind: 'engine', at: now }],
      provenance: 'backtest',
      href: '/evolution',
    })
  }

  return out
}

/* ------------------------------- Portfolio ------------------------------ */

export interface PortfolioSummary {
  value: number
  changePct: number
  topSector: SectorId
  topSectorShare: number
  topMover: { symbol: string; changePct: number }
  holdingsCount: number
}

export function computePortfolio(quotes: Record<string, Quote>): PortfolioSummary | null {
  const rows = PORTFOLIO_HOLDINGS.map((h) => ({ h, q: quotes[h.symbol] })).filter(
    (r): r is { h: (typeof PORTFOLIO_HOLDINGS)[number]; q: Quote } => Boolean(r.q),
  )
  if (rows.length === 0) return null

  let value = 0
  let weightedChange = 0
  const sectorValue = new Map<SectorId, number>()
  let topMover = { symbol: rows[0].h.symbol, changePct: rows[0].q.changePct }

  for (const { h, q } of rows) {
    const v = h.quantity * q.price
    value += v
    weightedChange += v * q.changePct
    const sector = ASSET_BY_SYMBOL[h.symbol]?.sector ?? 'infra'
    sectorValue.set(sector, (sectorValue.get(sector) ?? 0) + v)
    if (q.changePct > topMover.changePct) topMover = { symbol: h.symbol, changePct: q.changePct }
  }

  let topSector: SectorId = 'infra'
  let topSectorValue = 0
  for (const [sector, v] of sectorValue) {
    if (v > topSectorValue) {
      topSectorValue = v
      topSector = sector
    }
  }

  return {
    value: Math.round(value),
    changePct: value > 0 ? Number((weightedChange / value).toFixed(2)) : 0,
    topSector,
    topSectorShare: value > 0 ? Math.round((topSectorValue / value) * 100) : 0,
    topMover,
    holdingsCount: rows.length,
  }
}

/* -------------------------------- Activity ------------------------------ */

export function generateActivity(opts: {
  snapshot: MarketSnapshot
  analyses: AssetAnalysis[]
  insightCount: number
  predictions: Prediction[]
  evaluationCount: number
  now: number
}): ActivityEvent[] {
  const { snapshot, analyses, insightCount, predictions, evaluationCount, now } = opts
  const signalCount = analyses.reduce((a, x) => a + x.signals.length, 0)
  const active = predictions.filter((p) => p.status === 'active' || p.status === 'created').length

  return [
    {
      id: `act-observe-${now}`,
      kind: 'observe',
      title: 'Observation cycle completed',
      detail: `${EQUITY_SYMBOLS.length} instruments sampled · ${signalCount} signals raised`,
      at: now,
      priority: 0,
    },
    {
      id: `act-understand-${now}`,
      kind: 'understand',
      title: `Regime classified as ${snapshot.regime.regime}`,
      detail: snapshot.regime.evidence[0],
      at: now + 1,
      priority: snapshot.regime.regime === 'risk-off' || snapshot.regime.regime === 'stressed' ? 2 : 1,
      href: '/markets',
    },
    {
      id: `act-analyze-${now}`,
      kind: 'analyze',
      title: `Conviction computed for ${analyses.length} assets`,
      detail: `Breadth ${Math.round(snapshot.breadth * 100)}% advancing · ${snapshot.sectorPerformance.length} sectors ranked`,
      at: now + 2,
      priority: 0,
      href: '/markets',
    },
    {
      id: `act-generate-${now}`,
      kind: 'generate',
      title: `${insightCount} insights drafted`,
      detail: 'Every insight carries its evidence, confidence and invalidation.',
      at: now + 3,
      priority: 0,
    },
    {
      id: `act-track-${now}`,
      kind: 'track',
      title: `Tracking ${active} active scenarios`,
      detail: 'Scenarios are monitored until their horizon resolves.',
      at: now + 4,
      priority: 0,
      href: '/predictions',
    },
    ...(evaluationCount > 0
      ? [
          {
            id: `act-evaluate-${now}`,
            kind: 'evaluate' as const,
            title: `${evaluationCount} scenarios evaluated`,
            detail: 'Outcomes counted against expectations.',
            at: now + 5,
            priority: 1 as const,
            href: '/evolution',
          },
        ]
      : []),
    ...(predictions.some((p) => p.outcome === 'matched')
      ? [
          {
            id: `act-learn-${now}`,
            kind: 'learn' as const,
            title: 'Calibration updated from evaluated scenarios',
            detail: scoreBucketOf(predictions),
            at: now + 6,
            priority: 1 as const,
            href: '/evolution',
          },
        ]
      : []),
  ]
}

function scoreBucketOf(predictions: Prediction[]): string {
  const evaluated = predictions.filter((p) => p.outcome)
  const matched = evaluated.filter((p) => p.outcome === 'matched').length
  return `${matched} of ${evaluated.length} evaluated scenarios matched their direction.`
}
