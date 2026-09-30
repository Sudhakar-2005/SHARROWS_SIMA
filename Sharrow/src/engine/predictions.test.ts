import { describe, expect, it } from 'vitest'
import type { Conviction, Signal } from './types'
import { findBannedPhrase, isSafeLanguage } from './narrative'
import {
  classifyOutcome,
  createPrediction,
  evaluatePrediction,
  horizonForScore,
  resolvePrediction,
} from './predictions'

const NOW = 1_700_000_000_000
const SESSION = 86_400_000

function sig(partial: Partial<Signal> & { id: string }): Signal {
  return {
    kind: 'technical',
    direction: 'bullish',
    strength: 0.9,
    confidence: 80,
    title: 'Trend structure positive',
    summary: 'Price holds above rising averages.',
    evidence: [],
    sources: [],
    observedAt: NOW,
    ...partial,
  }
}

function conviction(partial: Partial<Conviction>): Conviction {
  return {
    score: 70,
    direction: 'bullish',
    regime: 'constructive',
    contributing: [sig({ id: 'lead' })],
    counterSignals: [],
    computedAt: NOW,
    provenance: 'derived',
    ...partial,
  }
}

const flatCloses = Array.from({ length: 120 }, (_, i) => 1000 + i * 2)

describe('createPrediction', () => {
  it('refuses neutral direction', () => {
    expect(
      createPrediction({
        symbol: 'TCS',
        conviction: conviction({ direction: 'neutral', score: 80 }),
        signals: [sig({ id: 'x' })],
        closes: flatCloses,
        regime: 'neutral',
        now: NOW,
        id: 'p1',
      }),
    ).toBeNull()
  })

  it('refuses low conviction', () => {
    expect(
      createPrediction({
        symbol: 'TCS',
        conviction: conviction({ score: 30 }),
        signals: [sig({ id: 'x' })],
        closes: flatCloses,
        regime: 'neutral',
        now: NOW,
        id: 'p1',
      }),
    ).toBeNull()
  })

  it('produces a safe, conditional scenario with invalidation', () => {
    const p = createPrediction({
      symbol: 'TCS',
      conviction: conviction({ score: 78 }),
      signals: [sig({ id: 'lead' })],
      closes: flatCloses,
      regime: 'constructive',
      now: NOW,
      id: 'p1',
    })
    expect(p).not.toBeNull()
    expect(p!.scenario.startsWith('Scenario:')).toBe(true)
    expect(isSafeLanguage(p!.scenario)).toBe(true)
    expect(p!.status).toBe('active')
    expect(p!.invalidation.length).toBeGreaterThanOrEqual(2)
    expect(p!.risks.length).toBeGreaterThanOrEqual(2)
    expect(p!.supportingSignals.length).toBeGreaterThan(0)
    expect(p!.entryPrice).toBeGreaterThan(0)
    expect(p!.targetPrice).toBeGreaterThan(0)
    expect(p!.horizonDays).toBe(horizonForScore(78))
  })
})

describe('classifyOutcome', () => {
  it('matches when direction agrees and magnitude holds', () => {
    expect(classifyOutcome(4, 3.5)).toBe('matched')
  })
  it('is partial when direction agrees but magnitude falls short', () => {
    expect(classifyOutcome(4, 1)).toBe('partial')
  })
  it('missed when direction disagrees', () => {
    expect(classifyOutcome(4, -2)).toBe('missed')
  })
  it('inconclusive when the expectation is trivially small', () => {
    expect(classifyOutcome(0.1, 0.05)).toBe('inconclusive')
  })
})

describe('resolve + evaluate', () => {
  it('does not resolve before the horizon elapses', () => {
    const p = createPrediction({
      symbol: 'TCS',
      conviction: conviction({ score: 70 }),
      signals: [sig({ id: 'lead' })],
      closes: flatCloses,
      regime: 'constructive',
      now: NOW,
      id: 'p2',
    })!
    expect(resolvePrediction(p, 1100, NOW + SESSION * 2)).toBeNull()
  })

  it('resolves after the horizon and evaluates into a record', () => {
    const p = createPrediction({
      symbol: 'TCS',
      conviction: conviction({ score: 70 }),
      signals: [sig({ id: 'lead' })],
      closes: flatCloses,
      regime: 'constructive',
      now: NOW,
      id: 'p3',
    })!
    const later = NOW + SESSION * (p.horizonDays + 2)
    const resolved = resolvePrediction(p, p.entryPrice! * 1.03, later)
    expect(resolved).not.toBeNull()
    expect(resolved!.actualMovePct).toBeCloseTo(3, 0)
    expect(resolved!.outcome).toBeDefined()

    const evaluated = evaluatePrediction(resolved!, later, 'v1.0.0')
    expect(evaluated.status).toBe('evaluated')
    expect(evaluated.evaluation).toBeDefined()
    expect(evaluated.evaluation!.factors.length).toBeGreaterThanOrEqual(3)
    expect(isSafeLanguage(evaluated.evaluation!.headline)).toBe(true)
    expect(isSafeLanguage(evaluated.evaluation!.learningSummary)).toBe(true)
    expect(evaluated.evaluation!.engineVersion).toBe('v1.0.0')
  })
})

describe('banned language guard', () => {
  it('flags guarantee phrasing', () => {
    expect(findBannedPhrase('This is guaranteed to work')).toBe('guaranteed')
    expect(findBannedPhrase('a risk-free scenario')).toBe('risk-free')
    expect(isSafeLanguage('If the pattern persists, price may extend')).toBe(true)
  })
})
