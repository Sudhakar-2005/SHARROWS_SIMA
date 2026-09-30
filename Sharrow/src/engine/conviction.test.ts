import { describe, expect, it } from 'vitest'
import type { Signal } from './types'
import { computeConviction, KIND_WEIGHT, scoreBucket } from './conviction'

function sig(partial: Partial<Signal> & { id: string }): Signal {
  return {
    kind: 'technical',
    direction: 'bullish',
    strength: 0.8,
    confidence: 70,
    title: 'Test signal',
    summary: 'Summary text.',
    evidence: [],
    sources: [],
    observedAt: 0,
    ...partial,
  }
}

const NOW = 1_700_000_000_000

describe('computeConviction', () => {
  it('is neutral and zero with no signals', () => {
    const c = computeConviction({ signals: [], regime: 'neutral', now: NOW })
    expect(c.direction).toBe('neutral')
    expect(c.score).toBe(0)
  })

  it('turns fully aligned bullish signals into bullish direction', () => {
    const signals = [
      sig({ id: 'a', direction: 'bullish', kind: 'technical' }),
      sig({ id: 'b', direction: 'bullish', kind: 'fundamental' }),
      sig({ id: 'c', direction: 'bullish', kind: 'context' }),
    ]
    const c = computeConviction({ signals, regime: 'constructive', now: NOW })
    expect(c.direction).toBe('bullish')
    expect(c.score).toBeGreaterThan(30)
    expect(c.score).toBeLessThanOrEqual(100)
    expect(c.contributing).toHaveLength(3)
    expect(c.counterSignals).toHaveLength(0)
  })

  it('gives stronger scores to stronger evidence', () => {
    const weak = computeConviction({
      signals: [sig({ id: 'w', strength: 0.3, confidence: 50 })],
      regime: 'neutral',
      now: NOW,
    })
    const strong = computeConviction({
      signals: [sig({ id: 's', strength: 1, confidence: 90 })],
      regime: 'neutral',
      now: NOW,
    })
    expect(strong.score).toBeGreaterThan(weak.score)
  })

  it('lowers scores when evidence is mixed rather than inventing direction', () => {
    const aligned = computeConviction({
      signals: [
        sig({ id: 'a', direction: 'bullish' }),
        sig({ id: 'b', direction: 'bullish' }),
      ],
      regime: 'neutral',
      now: NOW,
    })
    const mixed = computeConviction({
      signals: [
        sig({ id: 'a', direction: 'bullish' }),
        sig({ id: 'b', direction: 'bearish' }),
      ],
      regime: 'neutral',
      now: NOW,
    })
    expect(mixed.score).toBeLessThan(aligned.score)
    expect(mixed.counterSignals.length).toBeGreaterThan(0)
  })

  it('resolves near-symmetric evidence to neutral', () => {
    const c = computeConviction({
      signals: [
        sig({ id: 'a', direction: 'bullish', strength: 0.7, confidence: 70 }),
        sig({ id: 'b', direction: 'bearish', strength: 0.7, confidence: 70 }),
        sig({ id: 'c', direction: 'neutral', strength: 0.5 }),
      ],
      regime: 'neutral',
      now: NOW,
    })
    expect(c.direction).toBe('neutral')
  })

  it('weight map covers every signal kind and sums to one', () => {
    const total = Object.values(KIND_WEIGHT).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 5)
  })
})

describe('scoreBucket', () => {
  it('maps score ranges to bands', () => {
    expect(scoreBucket(80)).toBe('high-conviction')
    expect(scoreBucket(60)).toBe('elevated-conviction')
    expect(scoreBucket(40)).toBe('moderate-conviction')
    expect(scoreBucket(10)).toBe('low-conviction')
  })
})
