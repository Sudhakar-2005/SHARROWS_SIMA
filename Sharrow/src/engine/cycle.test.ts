import { describe, expect, it } from 'vitest'
import type { Candle, Quote } from './types'
import { EQUITY_SYMBOLS, INDEX_SYMBOLS } from '@/data/universe'
import {
  buildAssetAnalysis,
  buildMarketSnapshot,
  computePortfolio,
  generateActivity,
  generateInsights,
} from './cycle'
import { isSafeLanguage } from './narrative'

const NOW = 1_700_000_000_000

function makeCandles(n = 220, trend = 1.2): Candle[] {
  return Array.from({ length: n }, (_, i) => {
    const c = 900 + i * trend + Math.sin(i / 7) * 9
    return {
      t: NOW - (n - i) * 86_400_000,
      o: c - 2,
      h: c + 5,
      l: c - 6,
      c,
      v: 120_000 + i * 15,
    }
  })
}

function makeQuotes(): Record<string, Quote> {
  const out: Record<string, Quote> = {}
  const symbols = [...EQUITY_SYMBOLS, ...INDEX_SYMBOLS]
  symbols.forEach((symbol, idx) => {
    const price = 800 + (idx % 12) * 160
    const changePct = ((idx % 7) - 3) * 0.45
    const prevClose = price / (1 + changePct / 100)
    out[symbol] = {
      symbol,
      price,
      prevClose,
      change: price - prevClose,
      changePct,
      dayHigh: price * 1.012,
      dayLow: price * 0.988,
      volume: 950_000 + idx * 1_000,
      updatedAt: NOW,
      provenance: 'simulated',
    }
  })
  return out
}

const fakeSeries = () => makeCandles()

describe('buildMarketSnapshot', () => {
  const quotes = makeQuotes()
  const snapshot = buildMarketSnapshot({ quotes, now: NOW, seriesProvider: fakeSeries })

  it('accounts for every instrument in breadth', () => {
    expect(snapshot.advancing + snapshot.declining + snapshot.unchanged).toBe(
      EQUITY_SYMBOLS.length,
    )
    expect(snapshot.breadth).toBeGreaterThanOrEqual(0)
    expect(snapshot.breadth).toBeLessThanOrEqual(1)
  })

  it('ranks every sector with a leader', () => {
    expect(snapshot.sectorPerformance).toHaveLength(8)
    for (const s of snapshot.sectorPerformance) {
      expect(s.name.length).toBeGreaterThan(0)
      expect(Number.isFinite(s.changePct)).toBe(true)
      expect(s.leader.symbol.length).toBeGreaterThan(0)
    }
  })

  it('classifies a regime with confidence and evidence', () => {
    expect(snapshot.regime.regime).toBeTruthy()
    expect(snapshot.regime.confidence).toBeGreaterThanOrEqual(40)
    expect(snapshot.regime.confidence).toBeLessThanOrEqual(92)
    expect(snapshot.regime.evidence.length).toBeGreaterThan(0)
  })

  it('reports non-negative volatility inputs', () => {
    expect(snapshot.volatilityPct).toBeGreaterThanOrEqual(0)
    expect(snapshot.volatilityBaselinePct).toBeGreaterThanOrEqual(0)
  })

  it('is labelled as derived, not observed', () => {
    expect(snapshot.provenance).toBe('derived')
  })
})

describe('buildAssetAnalysis', () => {
  const quotes = makeQuotes()
  const snapshot = buildMarketSnapshot({ quotes, now: NOW, seriesProvider: fakeSeries })
  const analysis = buildAssetAnalysis({
    symbol: 'TCS',
    quotes,
    snapshot,
    news: [
      {
        id: 'n1',
        headline: 'TCS signs a large deal',
        sentiment: 'positive',
        confidence: 80,
        marketImpact: 'moderate',
        affectedSymbols: ['TCS'],
      },
    ],
    now: NOW,
    seriesProvider: fakeSeries,
  })

  it('raises signals from multiple families', () => {
    expect(analysis.signals.length).toBeGreaterThanOrEqual(6)
    const kinds = new Set(analysis.signals.map((s) => s.kind))
    expect(kinds.has('technical')).toBe(true)
    expect(kinds.has('fundamental')).toBe(true)
    expect(kinds.has('news')).toBe(true)
    expect(kinds.has('context')).toBe(true)
  })

  it('gives every signal evidence, a source and an expiry', () => {
    for (const s of analysis.signals) {
      expect(s.evidence.length).toBeGreaterThan(0)
      expect(s.sources.length).toBeGreaterThan(0)
      expect(s.validUntil).toBeGreaterThan(NOW)
      expect(s.confidence).toBeGreaterThan(0)
      expect(s.confidence).toBeLessThanOrEqual(100)
      expect(isSafeLanguage(s.title)).toBe(true)
      expect(isSafeLanguage(s.summary)).toBe(true)
    }
  })

  it('computes conviction inside the scoring bounds', () => {
    expect(analysis.conviction.score).toBeGreaterThanOrEqual(0)
    expect(analysis.conviction.score).toBeLessThanOrEqual(100)
    expect(['bullish', 'bearish', 'neutral']).toContain(analysis.conviction.direction)
    expect(analysis.conviction.provenance).toBe('derived')
  })
})

describe('generateInsights', () => {
  const quotes = makeQuotes()
  const snapshot = buildMarketSnapshot({ quotes, now: NOW, seriesProvider: fakeSeries })
  const analyses = ['TCS', 'RELIANCE', 'HDFCBANK', 'INFY'].map((symbol) =>
    buildAssetAnalysis({ symbol, quotes, snapshot, news: [], now: NOW, seriesProvider: fakeSeries }),
  )
  const predictions = [
    {
      id: 'p1',
      symbol: 'TCS',
      title: 'Scenario',
      scenario: 'Scenario text.',
      direction: 'bullish' as const,
      horizon: '10 sessions',
      horizonDays: 10,
      confidence: 76,
      status: 'evaluated' as const,
      createdAt: NOW - 1_000_000,
      createdBy: 'engine' as const,
      supportingSignals: ['TCS-tech-trend'],
      risks: [],
      invalidation: [],
      outcome: 'matched' as const,
      evaluation: {
        at: NOW,
        verdict: 'matched' as const,
        headline: 'Matched',
        delta: 'delta',
        factors: ['f'],
        learningSummary: 'summary',
        engineVersion: 'v1.0.0',
      },
    },
  ]

  const insights = generateInsights({
    snapshot,
    analyses,
    quotes,
    predictions,
    now: NOW,
  })

  it('produces at least a regime and portfolio insight', () => {
    expect(insights.length).toBeGreaterThanOrEqual(2)
    expect(insights.some((i) => i.kind === 'regime')).toBe(true)
    expect(insights.some((i) => i.kind === 'portfolio')).toBe(true)
  })

  it('every insight carries provenance-safe language and sources', () => {
    for (const i of insights) {
      expect(i.sources.length).toBeGreaterThan(0)
      expect(i.confidence).toBeGreaterThan(0)
      expect(i.confidence).toBeLessThanOrEqual(100)
      expect(['informational', 'important', 'critical']).toContain(i.importance)
      expect(isSafeLanguage(i.headline)).toBe(true)
      expect(isSafeLanguage(i.why)).toBe(true)
      expect(isSafeLanguage(i.changed)).toBe(true)
      if (i.risk) expect(isSafeLanguage(i.risk)).toBe(true)
      expect(i.provenance).not.toBe('live')
    }
  })
})

describe('computePortfolio', () => {
  it('values holdings and splits sector exposure', () => {
    const quotes = makeQuotes()
    const summary = computePortfolio(quotes)
    expect(summary).not.toBeNull()
    expect(summary!.value).toBeGreaterThan(0)
    expect(summary!.holdingsCount).toBeGreaterThan(0)
    expect(summary!.topSectorShare).toBeGreaterThan(0)
    expect(summary!.topSectorShare).toBeLessThanOrEqual(100)
    expect(Number.isFinite(summary!.changePct)).toBe(true)
  })

  it('returns null without quotes', () => {
    expect(computePortfolio({})).toBeNull()
  })
})

describe('generateActivity', () => {
  it('narrates the cycle stages', () => {
    const quotes = makeQuotes()
    const snapshot = buildMarketSnapshot({ quotes, now: NOW, seriesProvider: fakeSeries })
    const events = generateActivity({
      snapshot,
      analyses: [],
      insightCount: 3,
      predictions: [],
      evaluationCount: 0,
      now: NOW,
    })
    const kinds = events.map((e) => e.kind)
    for (const stage of ['observe', 'understand', 'analyze', 'generate', 'track']) {
      expect(kinds).toContain(stage)
    }
    for (const e of events) {
      expect(e.title.length).toBeGreaterThan(0)
      expect(e.at).toBeGreaterThanOrEqual(NOW)
      expect(isSafeLanguage(e.title)).toBe(true)
      if (e.detail) expect(isSafeLanguage(e.detail)).toBe(true)
    }
  })
})
