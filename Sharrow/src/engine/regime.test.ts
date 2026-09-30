import { describe, expect, it } from 'vitest'
import { assessRegime, regimeDescription, regimeLabel } from './regime'

function rising(n: number, from = 100, step = 1.5): number[] {
  return Array.from({ length: n }, (_, i) => from + i * step)
}

function falling(n: number, from = 500, step = 4): number[] {
  return Array.from({ length: n }, (_, i) => from - i * step + Math.sin(i) * 12)
}

describe('assessRegime', () => {
  it('reads a steady uptrend with broad participation as constructive or neutral', () => {
    const result = assessRegime({ closes: rising(140), breadth: 0.72 })
    expect(['constructive', 'neutral']).toContain(result.regime)
    expect(result.score).toBeGreaterThan(0)
  })

  it('reads a sustained high-volatility decline as stressed or risk-off', () => {
    const result = assessRegime({ closes: falling(140), breadth: 0.18 })
    expect(['stressed', 'risk-off', 'defensive']).toContain(result.regime)
    expect(result.score).toBeLessThan(0)
  })

  it('keeps confidence inside the honest band', () => {
    for (const breadth of [0.2, 0.5, 0.8]) {
      const result = assessRegime({ closes: rising(140), breadth })
      expect(result.confidence).toBeGreaterThanOrEqual(40)
      expect(result.confidence).toBeLessThanOrEqual(92)
    }
  })

  it('always produces evidence for the UI', () => {
    const result = assessRegime({ closes: rising(140), breadth: 0.6 })
    expect(result.evidence.length).toBeGreaterThanOrEqual(4)
    for (const line of result.evidence) expect(line.length).toBeGreaterThan(10)
  })

  it('is deterministic for identical inputs', () => {
    const a = assessRegime({ closes: falling(140), breadth: 0.3 })
    const b = assessRegime({ closes: falling(140), breadth: 0.3 })
    expect(a).toEqual(b)
  })
})

describe('regime labelling', () => {
  it('labels and describes every regime', () => {
    for (const r of ['constructive', 'neutral', 'defensive', 'stressed', 'risk-off'] as const) {
      expect(regimeLabel(r).length).toBeGreaterThan(0)
      expect(regimeDescription(r).length).toBeGreaterThan(20)
    }
  })
})
