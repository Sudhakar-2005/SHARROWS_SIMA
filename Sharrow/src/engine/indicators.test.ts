import { describe, expect, it } from 'vitest'
import {
  ema,
  lastSma,
  maxDrawdown,
  roc,
  rsi,
  sma,
  volatility,
  zscore,
} from './indicators'

describe('sma', () => {
  it('waits for a full window then averages', () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4])
  })

  it('lastSma returns the trailing average', () => {
    expect(lastSma([1, 2, 3, 4, 5], 3)).toBe(4)
  })
})

describe('ema', () => {
  it('smooths toward newer values', () => {
    const out = ema([1, 1, 1, 10, 10, 10], 3)
    expect(out[5]).toBeGreaterThan(1)
    expect(out[5]).toBeLessThan(10)
  })
})

describe('rsi', () => {
  it('is 100 on a monotonically rising series', () => {
    expect(rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 14)).toBe(100)
  })

  it('approaches 0 on a monotonically falling series', () => {
    const value = rsi([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 14)
    expect(value).not.toBeNull()
    expect(value as number).toBeLessThan(1)
  })

  it('returns null when there is not enough data', () => {
    expect(rsi([1, 2, 3], 14)).toBeNull()
  })
})

describe('volatility', () => {
  it('is zero for a flat series', () => {
    expect(volatility(new Array(30).fill(100), 20)).toBe(0)
  })

  it('is positive for a varying series', () => {
    const series = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 5)
    expect(volatility(series, 20)).toBeGreaterThan(0)
  })
})

describe('roc', () => {
  it('computes percent change over the window', () => {
    expect(roc([100, 100, 110], 2)).toBeCloseTo(10, 6)
  })

  it('returns null without enough data', () => {
    expect(roc([100], 5)).toBeNull()
  })
})

describe('zscore', () => {
  it('is zero when the last value equals the mean', () => {
    expect(zscore([10, 10, 10, 10, 10], 5)).toBe(0)
  })

  it('is strongly positive for an outlier high', () => {
    expect(zscore([10, 10, 10, 10, 20], 5)).toBeGreaterThan(1)
  })
})

describe('maxDrawdown', () => {
  it('measures peak-to-trough decline', () => {
    expect(maxDrawdown([100, 80, 90])).toBeCloseTo(-20, 5)
  })

  it('is zero on a rising series', () => {
    expect(maxDrawdown([1, 2, 3, 4])).toBe(0)
  })
})
