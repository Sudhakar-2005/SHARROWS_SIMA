import { describe, expect, it } from 'vitest'
import {
  allSymbols,
  computeQuote,
  getDailySeries,
  getLivePrice,
  seedQuotes,
  withLiveTail,
} from '@/services/market-data'
import { EQUITY_SYMBOLS, INDEX_SYMBOLS } from '@/data/universe'

describe('simulated quote session', () => {
  it('produces a mixed session, not an all-green tape', () => {
    seedQuotes()
    const moves = EQUITY_SYMBOLS.map((s) => computeQuote(s).changePct)
    const advancing = moves.filter((m) => m > 0.05).length
    const declining = moves.filter((m) => m < -0.05).length

    expect(moves.length).toBe(EQUITY_SYMBOLS.length)
    expect(advancing).toBeLessThan(EQUITY_SYMBOLS.length)
    expect(declining).toBeGreaterThan(0)
    // Session moves stay inside a plausible daily band.
    for (const m of moves) expect(Math.abs(m)).toBeLessThan(6)
  })

  it('keeps quotes consistent with the chart tail', () => {
    seedQuotes()
    for (const symbol of [...INDEX_SYMBOLS.slice(0, 1), ...EQUITY_SYMBOLS.slice(0, 3)]) {
      const quote = computeQuote(symbol)
      const tail = withLiveTail(symbol, getDailySeries(symbol))
      expect(tail[tail.length - 1].c).toBeCloseTo(quote.price, 2)
      expect(getLivePrice(symbol)).toBeCloseTo(quote.price, 2)
      expect(quote.dayHigh).toBeGreaterThanOrEqual(quote.price)
      expect(quote.dayLow).toBeLessThanOrEqual(quote.price)
    }
  })

  it('seeds every symbol in the universe exactly once', () => {
    seedQuotes()
    const symbols = allSymbols()
    expect(symbols.length).toBe(INDEX_SYMBOLS.length + EQUITY_SYMBOLS.length)
    for (const s of symbols) {
      const q = computeQuote(s)
      expect(q.price).toBeGreaterThan(0)
      expect(q.provenance).toBe('simulated')
    }
  })
})
