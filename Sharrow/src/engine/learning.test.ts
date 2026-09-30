import { describe, expect, it } from 'vitest'
import type { Prediction, PredictionOutcome } from './types'
import { deriveLearnings, deriveVersions, ENGINE_VERSION } from './learning'
import { isSafeLanguage } from './narrative'

const NOW = 1_700_000_000_000

function pred(partial: Partial<Prediction> & { id: string; outcome: PredictionOutcome }): Prediction {
  return {
    symbol: 'TCS',
    title: 'Scenario',
    scenario: 'Scenario text.',
    direction: 'bullish',
    horizon: '10 sessions',
    horizonDays: 10,
    confidence: 80,
    status: 'evaluated',
    createdAt: NOW - 86_400_000 * 20,
    createdBy: 'engine',
    supportingSignals: ['TCS-tech-trend'],
    risks: [],
    invalidation: [],
    resolvedAt: NOW - 86_400_000 * 5,
    resolvedPrice: 1050,
    actualMovePct: 3,
    expectedMovePct: 3,
    regimeAtCreation: 'neutral',
    evaluation: {
      at: NOW,
      verdict: partial.outcome,
      headline: 'Evaluation headline',
      delta: 'delta',
      factors: ['factor'],
      learningSummary: 'summary',
      engineVersion: ENGINE_VERSION,
    },
    ...partial,
  }
}

describe('deriveLearnings', () => {
  it('returns nothing without evaluated records', () => {
    expect(deriveLearnings([], NOW)).toEqual([])
    expect(
      deriveLearnings(
        [pred({ id: 'a', outcome: undefined as unknown as PredictionOutcome, evaluation: undefined })],
        NOW,
      ),
    ).toEqual([])
  })

  it('produces calibration learnings with counted evidence', () => {
    const records = Array.from({ length: 6 }, (_, i) =>
      pred({
        id: `p${i}`,
        outcome: i % 2 === 0 ? 'matched' : 'missed',
        confidence: 80,
        supportingSignals: [`SYM${i}-tech-trend`],
        symbol: `SYM${i}`,
      }),
    )
    const learnings = deriveLearnings(records, NOW)
    const calibration = learnings.filter((l) => l.kind === 'calibration')
    expect(calibration.length).toBeGreaterThanOrEqual(1)
    for (const l of learnings) {
      expect(l.sampleSize).toBeGreaterThan(0)
      expect(isSafeLanguage(l.title)).toBe(true)
      expect(isSafeLanguage(l.detail)).toBe(true)
      expect(l.provenance).toBe('backtest')
    }
  })

  it('validates once the sample is large enough', () => {
    const records = Array.from({ length: 7 }, (_, i) =>
      pred({ id: `p${i}`, outcome: 'matched', confidence: 80, symbol: `S${i}` }),
    )
    const learnings = deriveLearnings(records, NOW)
    expect(learnings.some((l) => l.status === 'validated')).toBe(true)
  })
})

describe('deriveVersions', () => {
  it('always ships the baseline version', () => {
    const versions = deriveVersions([], NOW)
    expect(versions).toHaveLength(1)
    expect(versions[0].version).toBe(ENGINE_VERSION)
    expect(versions[0].status).toBe('deployed')
    expect(isSafeLanguage(versions[0].changeSummary)).toBe(true)
  })

  it('deploys a follow-up version only when two learnings validate', () => {
    const records = [
      ...Array.from({ length: 6 }, (_, i) =>
        pred({
          id: `m${i}`,
          outcome: 'matched',
          confidence: 80,
          symbol: `A${i}`,
          supportingSignals: [`A${i}-tech-trend`],
        }),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        pred({
          id: `x${i}`,
          outcome: 'missed',
          confidence: 80,
          symbol: `B${i}`,
          supportingSignals: [`B${i}-fund-quality`],
        }),
      ),
    ]
    const learnings = deriveLearnings(records, NOW)
    const validated = learnings.filter((l) => l.status === 'validated')
    expect(validated.length).toBeGreaterThanOrEqual(2)

    const versions = deriveVersions(learnings, NOW)
    expect(versions.length).toBe(2)
    expect(versions[1].status).toBe('deployed')
    expect(versions[1].relatedLearningIds.length).toBeGreaterThanOrEqual(2)
    expect(isSafeLanguage(versions[1].reason)).toBe(true)
  })

  it('stays in validating state with a single validated learning', () => {
    // One calibration sample validates, but alternating regimes keep the
    // regime-behaviour learning below its own validation threshold.
    const records = Array.from({ length: 6 }, (_, i) =>
      pred({
        id: `p${i}`,
        outcome: 'matched',
        confidence: 40,
        symbol: `S${i}`,
        regimeAtCreation: i % 2 === 0 ? 'constructive' : 'defensive',
      }),
    )
    const learnings = deriveLearnings(records, NOW)
    expect(learnings.filter((l) => l.status === 'validated')).toHaveLength(1)

    const versions = deriveVersions(learnings, NOW)
    const followUp = versions.find((v) => v.version !== ENGINE_VERSION)
    expect(followUp).toBeDefined()
    expect(followUp!.status).toBe('validating')
  })
})
